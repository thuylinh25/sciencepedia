/**
 * Danh mục nơi quan sát đóng gói sẵn cho trang "Mô phỏng bầu trời".
 *
 * ## Vì sao đóng gói trong repo, không gọi dịch vụ geocoding
 *
 * Cùng lý do `/space-map` giữ danh mục thiên thể trong `sky-data.ts`: trang
 * công cụ phải tĩnh hoàn toàn và không rò vị trí người đọc cho bên thứ ba.
 * Mười thành phố Việt Nam phủ ba miền cộng vài thành phố thế giới làm mốc đối
 * chiếu (đổi bán cầu, đổi múi giờ) là đủ cho Phase 1; tra cứu địa danh tự do
 * thuộc Phase sau và cũng sẽ đi qua một danh mục tĩnh lớn hơn, không qua API
 * ngoài.
 *
 * Toạ độ là tâm hành chính của thành phố, làm tròn bốn chữ số thập phân —
 * độ chính xác cỡ trăm mét, thừa cho một bản đồ bầu trời mắt thường: lệch
 * 100 km cũng chỉ xê dịch vị trí biểu kiến của hành tinh chưa tới 0,1°.
 */
export type SkyLocation = {
  id: string;
  name: string;
  nameEn: string;
  lat: number;
  lon: number;
  /**
   * Múi giờ IANA của nơi quan sát. Từ Phase 2, ô nhập ngày giờ sửa theo
   * GIỜ TƯỜNG của nơi đang xem (đứng ở Tokyo thì 21:00 là 21:00 giờ Tokyo),
   * không theo giờ máy của người đọc — xem `timezone.ts`. Thiếu trường này
   * là cả trang hiểu sai thời gian ở nửa kia Trái Đất.
   */
  tz: string;
};

export const SKY_LOCATIONS: SkyLocation[] = [
  { id: "ha-noi", name: "Hà Nội", nameEn: "Hanoi", lat: 21.0285, lon: 105.8542, tz: "Asia/Ho_Chi_Minh" },
  { id: "hai-phong", name: "Hải Phòng", nameEn: "Haiphong", lat: 20.8449, lon: 106.6881, tz: "Asia/Ho_Chi_Minh" },
  { id: "sa-pa", name: "Sa Pa", nameEn: "Sa Pa", lat: 22.3364, lon: 103.8438, tz: "Asia/Ho_Chi_Minh" },
  { id: "hue", name: "Huế", nameEn: "Hue", lat: 16.4637, lon: 107.5909, tz: "Asia/Ho_Chi_Minh" },
  { id: "da-nang", name: "Đà Nẵng", nameEn: "Da Nang", lat: 16.0544, lon: 108.2022, tz: "Asia/Ho_Chi_Minh" },
  { id: "da-lat", name: "Đà Lạt", nameEn: "Da Lat", lat: 11.9404, lon: 108.4583, tz: "Asia/Ho_Chi_Minh" },
  { id: "nha-trang", name: "Nha Trang", nameEn: "Nha Trang", lat: 12.2388, lon: 109.1967, tz: "Asia/Ho_Chi_Minh" },
  { id: "tp-ho-chi-minh", name: "TP. Hồ Chí Minh", nameEn: "Ho Chi Minh City", lat: 10.8231, lon: 106.6297, tz: "Asia/Ho_Chi_Minh" },
  { id: "can-tho", name: "Cần Thơ", nameEn: "Can Tho", lat: 10.0452, lon: 105.7469, tz: "Asia/Ho_Chi_Minh" },
  { id: "phu-quoc", name: "Phú Quốc", nameEn: "Phu Quoc", lat: 10.2899, lon: 103.984, tz: "Asia/Ho_Chi_Minh" },
  { id: "singapore", name: "Singapore", nameEn: "Singapore", lat: 1.3521, lon: 103.8198, tz: "Asia/Singapore" },
  { id: "tokyo", name: "Tokyo", nameEn: "Tokyo", lat: 35.6762, lon: 139.6503, tz: "Asia/Tokyo" },
  { id: "sydney", name: "Sydney", nameEn: "Sydney", lat: -33.8688, lon: 151.2093, tz: "Australia/Sydney" },
  { id: "paris", name: "Paris", nameEn: "Paris", lat: 48.8566, lon: 2.3522, tz: "Europe/Paris" },
  { id: "london", name: "Luân Đôn", nameEn: "London", lat: 51.5074, lon: -0.1278, tz: "Europe/London" },
  { id: "new-york", name: "New York", nameEn: "New York", lat: 40.7128, lon: -74.006, tz: "America/New_York" },
  { id: "los-angeles", name: "Los Angeles", nameEn: "Los Angeles", lat: 34.0522, lon: -118.2437, tz: "America/Los_Angeles" },
];

/** Nơi quan sát mặc định khi trang vừa mở: thủ đô, trước khi người đọc chọn. */
export const DEFAULT_LOCATION: SkyLocation = SKY_LOCATIONS[0];

export function findSkyLocation(id: string): SkyLocation | undefined {
  return SKY_LOCATIONS.find((location) => location.id === id);
}
