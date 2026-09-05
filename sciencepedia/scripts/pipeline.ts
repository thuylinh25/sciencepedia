import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  query,
  type HookInput,
  type HookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";

/**
 * Chạy pipeline nội dung 11 bước không cần người ngồi cạnh.
 *
 *   npm run pipeline -- --count 1            # mặc định, chạy thật
 *   npm run pipeline -- --count 1 --dry-run  # agent không được ghi CSDL
 *   npm run pipeline -- --budget 3           # trần chi phí USD cho cả lần chạy
 *   npm run pipeline -- --model opus         # ghi đè model của luồng chính
 *
 * ## Vì sao luồng chính chạy Sonnet còn science-editor chạy Opus
 *
 * Chín trong mười một bước là việc thi hành: đọc hàng đợi, gọi skill, gom
 * nguồn, điền metadata, chạy script. Đó là việc Sonnet làm tốt, và nó chiếm
 * gần hết lượng token của một lần chạy.
 *
 * Bước 4 thì khác hẳn: `science-editor` cầm quyền phủ quyết, và cái nó bỏ sót
 * sẽ lên thẳng production. Đây là chỗ duy nhất trong chuỗi mà một phán đoán
 * sai không được bước nào phía sau bắt lại — nên nó là chỗ duy nhất đáng trả
 * giá Opus.
 *
 * Đặt cả chuỗi ở Opus là trả giá cao cho chín bước không cần nó; đặt cả chuỗi
 * ở Sonnet là tiết kiệm đúng chỗ không nên tiết kiệm.
 *
 * ## Vì sao là Agent SDK chứ không phải một chuỗi lời gọi API
 *
 * Tám agent trong `.claude/agents/` và chín skill trong `.claude/skills/` là
 * hệ quyết định của dự án này. Agent SDK chính là Claude Code đóng gói thành
 * thư viện, nên nó nạp thẳng những file đó — không phải viết lại lần hai bằng
 * TypeScript rồi trông chờ hai bản không trôi khỏi nhau.
 *
 * ## Xác thực
 *
 * `CLAUDE_CODE_OAUTH_TOKEN` (sinh bằng `claude setup-token`) dùng gói đăng ký
 * Claude, không cần API key. `ANTHROPIC_API_KEY` cũng chạy nếu có và sẽ được
 * ưu tiên. LƯU Ý: `@anthropic-ai/sdk` — thứ `src/lib/rewrite.ts` dùng — KHÔNG
 * đọc `CLAUDE_CODE_OAUTH_TOKEN`; chỉ đường này đọc.
 *
 * ## Vì sao settingSources chỉ có "project"
 *
 * Bỏ trống là nạp cả "user" và "local". Cả hai đều sai ở đây:
 *
 * - "local" đọc `.claude/settings.local.json`, mà file đó nằm trong
 *   `.gitignore` — nó KHÔNG có trong checkout của CI. Cấu hình chạy được trên
 *   máy bạn nhưng biến mất trên máy chủ là cấu hình tệ nhất, vì nó hỏng đúng
 *   lúc không ai nhìn. Đó cũng là lý do mọi lệnh cấm phải khai lại trong hook
 *   bên dưới thay vì trông vào file ấy.
 * - "user" đọc `~/.claude/` của người đang chạy, nên kết quả đổi theo máy.
 *
 * "project" thì nằm trong repo, đi cùng commit, và giống nhau ở mọi nơi.
 */

/** Repo gốc — nơi có CLAUDE.md và .claude/. Script này nằm ở sciencepedia/scripts. */
const REPO_ROOT = resolve(import.meta.dirname, "..", "..");

/**
 * Lệnh không bao giờ được chạy, dù agent nghĩ nó cần.
 *
 * Ba nhóm, ba lý do khác nhau:
 *
 * 1. **Lệnh đổi lược đồ / xoá dữ liệu.** Một lần `migrate reset` nhầm trên
 *    chuỗi kết nối production là mất cả kho. Không có lý do hợp lệ nào để một
 *    lần chạy nội dung đụng tới lược đồ.
 * 2. **Ghi thẳng vào CSDL bằng lệnh một dòng.** Đường ghi hợp lệ duy nhất là
 *    `npm run publish`, vì gate nằm trong đó. Cấm `-e`/`--eval` chặn lối tắt
 *    phổ biến nhất đi vòng qua nó.
 * 3. **Đẩy code và chạm vào secret.** Lần chạy này sinh nội dung, không sinh
 *    commit; và không có việc gì cần đọc `.env` ra ngoài.
 *
 * Danh sách này KHÔNG kín — agent viết được một file rồi chạy file đó. Nó là
 * hàng rào, không phải khoá. Khoá thật nằm trong `scripts/publish.ts`.
 */
const FORBIDDEN: { pattern: RegExp; reason: string }[] = [
  {
    pattern: /prisma\s+(migrate|db\s+(push|execute|seed))/i,
    reason: "Lệnh đổi lược đồ hoặc ghi hàng loạt không thuộc phạm vi một lần chạy nội dung.",
  },
  { pattern: /\bmigrate\s+reset\b/i, reason: "migrate reset xoá toàn bộ dữ liệu." },
  { pattern: /\bpsql\b/i, reason: "Không truy cập CSDL bằng client thô; dùng script trong scripts/." },
  {
    pattern: /\b(node|tsx|ts-node)\b[^|;]*\s(-e|--eval)\b/i,
    reason:
      "Không chạy mã một dòng đụng CSDL. Muốn xuất bản thì dùng `npm run publish -- --slug <slug>`, nơi gate được thi hành.",
  },
  { pattern: /\bgit\s+push\b/i, reason: "Lần chạy này không đẩy code." },
  { pattern: /\brm\s+-rf?\b/i, reason: "Không xoá đệ quy trong lần chạy tự động." },
  { pattern: /(^|\s)(cat|less|head|tail|type)\s+[^|;]*\.env\b/i, reason: "Không đọc file secret." },
];

/** `--dry-run` cấm luôn cả đường ghi hợp lệ, để chạy thử mà không chạm dữ liệu. */
const DRY_RUN_FORBIDDEN: { pattern: RegExp; reason: string }[] = [
  {
    pattern: /npm\s+run\s+publish\b|scripts\/publish\.ts/i,
    reason: "Đang chạy --dry-run: không đổi state bài viết.",
  },
];

function flagValue(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(`--${name}`);
  if (index !== -1 && argv[index + 1] && !argv[index + 1].startsWith("--")) {
    return argv[index + 1];
  }
  return argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
}

function buildPrompt(count: number, dryRun: boolean): string {
  return [
    `Dùng agent \`content-curator\` để đưa ${count} chủ đề tiếp theo qua trọn vẹn chuỗi 11 bước trong CLAUDE.md.`,
    "",
    "## Lấy chủ đề ở đâu",
    "",
    "`docs/content/topic-queue.md`, theo đúng thứ tự trong bảng, bỏ qua dòng nào đã có bài.",
    "Hàng đợi có cột phụ thuộc — không viết một chủ đề khi chủ đề nó phụ thuộc chưa có bài.",
    "",
    "## Ràng buộc",
    "",
    "- Làm việc trong `sciencepedia/`. Mọi lệnh npm chạy từ thư mục đó.",
    "- Bài mới tạo ở trạng thái DRAFT.",
    dryRun
      ? "- ĐANG CHẠY THỬ: không ghi gì vào CSDL. Soạn bài ra file trong `docs/content/drafts/` rồi báo cáo."
      : "- Xuất bản CHỈ bằng `npm run publish -- --slug <slug>`. Không có đường nào khác, và script đó sẽ từ chối nếu bài chưa đạt.",
    "- Kiểm bất cứ lúc nào bằng `npm run publish:check -- --slug <slug>`. Nó liệt kê chính xác những gì còn thiếu.",
    "- Bài không qua được gate thì ĐỂ NGUYÊN Ở DRAFT và ghi lý do vào báo cáo. Đừng nới điều kiện, đừng sửa script gate.",
    "- `science-editor` có quyền phủ quyết. Bị trả bài thì tối đa 2 vòng sửa, sau đó bỏ chủ đề và ghi lý do.",
    "- Một lỗi lặp 3 lần trong lượt này thì DỪNG, đừng vá từng bài — báo cáo lại để sửa brief.",
    "",
    "## Chạy tới hết — không giao việc chạy nền",
    "",
    "Subagent trong SDK mặc định chạy NỀN. Giao việc rồi kết thúc lượt là lần chạy",
    "chết tại chỗ: tiến trình thoát, subagent bị giết theo, và bạn báo cáo một",
    "kết quả không tồn tại. Lần chạy 2026-09-05 hỏng đúng như vậy.",
    "",
    "Nên: mọi lần gọi công cụ Agent PHẢI đặt `run_in_background: false`. Chờ kết",
    "quả trả về rồi mới đi tiếp. Không có vòng lặp nào đánh thức bạn giữa chừng,",
    "không có thông báo nào tới sau, và không có ai để hỏi.",
    "",
    "Chỉ báo cáo những gì bạn đã tận mắt thấy kết quả. Gặp chỗ mơ hồ thì chọn",
    "phương án dè dặt hơn, ghi lại lựa chọn, rồi đi tiếp.",
    "",
    "## Kết thúc bằng báo cáo",
    "",
    "Mỗi chủ đề một dòng: slug, trạng thái cuối (PUBLISHED / DRAFT), và nếu là DRAFT thì lý do bị chặn.",
  ].join("\n");
}

async function main() {
  const argv = process.argv.slice(2);
  const count = Number(flagValue(argv, "count") ?? 1);
  const budget = Number(flagValue(argv, "budget") ?? 5);
  const model = flagValue(argv, "model") ?? "sonnet";
  const dryRun = argv.includes("--dry-run");

  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    console.error(
      "Chưa có credential. Đặt CLAUDE_CODE_OAUTH_TOKEN (sinh bằng `claude setup-token`)\n" +
        "hoặc ANTHROPIC_API_KEY. Xem chú thích đầu file.",
    );
    process.exitCode = 1;
    return;
  }

  const rules = dryRun ? [...FORBIDDEN, ...DRY_RUN_FORBIDDEN] : FORBIDDEN;
  const denied: string[] = [];

  const guardBash = async (input: HookInput): Promise<HookJSONOutput> => {
    if (input.hook_event_name !== "PreToolUse") return {};
    const command = (input.tool_input as { command?: string }).command ?? "";
    const hit = rules.find((rule) => rule.pattern.test(command));
    if (!hit) return {};

    denied.push(command);
    console.warn(`\n[HOOK] Từ chối lệnh: ${command}\n        Lý do: ${hit.reason}`);
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        // Lý do được trả về cho agent làm tool result, nên nó phải nói được
        // đường đi đúng chứ không chỉ nói "không được".
        permissionDecisionReason: hit.reason,
      },
    };
  };

  console.log(`Repo:      ${REPO_ROOT}`);
  console.log(`Chủ đề:    ${count}`);
  console.log(`Trần chi:  $${budget}`);
  console.log(`Model:     ${model} (science-editor: opus)`);
  console.log(`Chế độ:    ${dryRun ? "CHẠY THỬ (không ghi CSDL)" : "chạy thật"}\n`);

  const started = Date.now();
  const transcript: string[] = [];
  let cost = 0;
  let outcome = "không rõ";

  try {
    for await (const message of query({
      prompt: buildPrompt(count, dryRun),
      options: {
        cwd: REPO_ROOT,
        // Luồng chính lo phần thi hành — xem chú thích đầu file.
        model,
        // Xem chú thích đầu file: cố ý bỏ "user" và "local".
        settingSources: ["project"],
        skills: "all",
        // Không có người để hỏi trong lần chạy tự động, nên mọi lời nhắc quyền
        // đều thành treo. Việc chặn do hook ở trên đảm nhiệm — đó mới là chỗ
        // luật được thi hành, không phải hộp thoại quyền.
        permissionMode: "bypassPermissions",
        agents: {
          // Người viết và người duyệt phải khác model. Cùng một model chấm bài
          // của chính nó thì cái nó bỏ sót lúc viết nó cũng bỏ sót lúc chấm —
          // sai sót tương quan, và "đã duyệt" trở thành một con dấu rỗng.
          //
          // Ghi đè này giữ nguyên giá trị kể cả khi `--model opus`: lúc đó hai
          // bên trùng model, nên phải đọc kết quả duyệt dè dặt hơn hẳn.
          "science-editor": {
            description:
              "Thẩm định độ chính xác khoa học, có quyền phủ quyết tuyệt đối. Đọc thẳng nguồn, không tin bản nháp.",
            prompt:
              "Bạn là science-editor của SciencePedia. Đọc `.claude/agents/science-editor.md` và làm đúng theo đó. " +
              "Mọi claim phải đối chiếu với nguồn gốc, không đối chiếu với bản nháp. Giữ nguyên mức độ dè dặt của nguồn.",
            model: "opus",
            // Bước duy nhất trong chuỗi mà một phán đoán sai không được bước
            // nào phía sau bắt lại. Đây là chỗ mua thêm suy nghĩ đáng tiền.
            effort: "high",
          },
        },
        hooks: { PreToolUse: [{ matcher: "Bash", hooks: [guardBash] }] },
        // Opus uỷ thác cho subagent khá thoải mái; không chặn thì một lượt chạy
        // nở thành cây agent và đốt hết hạn mức trước khi ra bài nào.
        env: {
          ...process.env,
          CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH: "1",
          CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS: "3",
        },
        maxBudgetUsd: budget,
      },
    })) {
      if (message.type === "assistant") {
        for (const block of message.message.content) {
          if (block.type === "text" && block.text.trim()) {
            console.log(block.text);
            transcript.push(block.text);
          }
        }
      }
      if (message.type === "result") {
        cost = message.total_cost_usd ?? 0;
        outcome = message.subtype;
        if ("result" in message && message.result) {
          console.log(`\n=== KẾT QUẢ ===\n${message.result}`);
          transcript.push(`=== KẾT QUẢ ===\n${message.result}`);
        }
      }
    }
  } catch (error) {
    // query() ném sau khi đã phát ra result, nên `cost` và `outcome` ở trên đã
    // được ghi lại. Đừng để lỗi nuốt mất báo cáo.
    outcome = `lỗi: ${(error as Error).message}`;
    console.error(`\nLần chạy kết thúc bằng lỗi: ${(error as Error).message}`);
  }

  const report = [
    `# Lần chạy pipeline ${new Date().toISOString()}`,
    "",
    `- Kết cục: ${outcome}`,
    `- Chi phí ước tính: $${cost.toFixed(2)} (trần $${budget})`,
    `- Thời gian: ${Math.round((Date.now() - started) / 1000)}s`,
    `- Chủ đề yêu cầu: ${count}${dryRun ? " (chạy thử)" : ""}`,
    `- Lệnh bị hook từ chối: ${denied.length}`,
    ...denied.map((c) => `  - \`${c}\``),
    "",
    "---",
    "",
    ...transcript,
  ].join("\n");

  const path = resolve(REPO_ROOT, "docs", "content", `pipeline-run-${Date.now()}.md`);
  writeFileSync(path, report, "utf8");
  console.log(`\nBáo cáo: ${path}`);
  console.log(`Chi phí: $${cost.toFixed(2)} · Kết cục: ${outcome}`);

  // error_max_budget_usd cũng là thất bại: nó nghĩa là lần chạy bị cắt giữa
  // chừng, không phải hoàn thành trong ngân sách.
  process.exitCode = outcome === "success" ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
