# Requirements Document

## Introduction

Hệ thống filter khách sạn cho phép người dùng lọc và tìm kiếm các khách sạn dựa trên nhiều tiêu chí khác nhau như xếp hạng sao, loại hình lưu trú, tiện nghi, khoảng giá và tình trạng phòng trống. Hệ thống tích hợp với React project hiện tại và sử dụng backend API để thực hiện tìm kiếm với các tham số filter.

## Glossary

- **Filter_System**: Hệ thống bộ lọc tìm kiếm khách sạn
- **Filter_Modal**: Giao diện modal để người dùng thiết lập các tiêu chí lọc
- **Hotel_Service**: Service backend để tìm kiếm khách sạn với các tham số filter
- **App_Context**: React Context quản lý state toàn cục của ứng dụng
- **Hotel_Sidebar**: Component hiển thị danh sách khách sạn và nút filter
- **Filter_State**: Trạng thái hiện tại của các tiêu chí filter được áp dụng
- **Search_Parameters**: Các tham số được gửi đến backend API để tìm kiếm
- **Hotel_Results**: Danh sách khách sạn trả về từ backend sau khi áp dụng filter

## Requirements

### Requirement 1: Filter Modal Interface

**User Story:** Là người dùng, tôi muốn có giao diện filter trực quan để thiết lập các tiêu chí tìm kiếm khách sạn.

#### Acceptance Criteria

1. WHEN người dùng click nút "Filters" trong Hotel_Sidebar, THE Filter_Modal SHALL hiển thị với overlay backdrop
2. THE Filter_Modal SHALL hiển thị các section filter: xếp hạng sao, loại hình lưu trú, tiện nghi, khoảng giá, và tùy chọn phòng trống
3. WHEN người dùng click outside modal hoặc nút "Hủy", THE Filter_Modal SHALL đóng và không áp dụng thay đổi
4. WHEN người dùng click nút "Áp dụng", THE Filter_Modal SHALL áp dụng filter và đóng modal
5. THE Filter_Modal SHALL hiển thị responsive trên các kích thước màn hình khác nhau

### Requirement 2: Star Rating Filter

**User Story:** Là người dùng, tôi muốn lọc khách sạn theo xếp hạng sao để tìm chỗ ở phù hợp với mong đợi chất lượng.

#### Acceptance Criteria

1. THE Filter_Modal SHALL hiển thị 5 nút tương ứng với 1-5 sao
2. WHEN người dùng click một nút sao, THE Filter_System SHALL chọn xếp hạng đó và bỏ chọn các xếp hạng khác
3. WHEN người dùng click lại nút sao đã chọn, THE Filter_System SHALL bỏ chọn xếp hạng sao
4. THE Filter_System SHALL hiển thị trạng thái active/inactive của từng nút sao bằng màu sắc và styling khác nhau

### Requirement 3: Property Type Filter

**User Story:** Là người dùng, tôi muốn lọc theo loại hình lưu trú để tìm đúng kiểu chỗ ở mình muốn.

#### Acceptance Criteria

1. THE Filter_Modal SHALL hiển thị danh sách các loại hình: Khách sạn, Penthouse, Resort, Villa, Homestay, Nhà nghỉ, Chung cư
2. WHEN người dùng click một loại hình, THE Filter_System SHALL toggle trạng thái chọn/bỏ chọn của loại hình đó
3. THE Filter_System SHALL cho phép chọn nhiều loại hình cùng lúc
4. THE Filter_System SHALL hiển thị checkbox với trạng thái checked/unchecked cho từng loại hình

### Requirement 4: Amenities Filter

**User Story:** Là người dùng, tôi muốn lọc theo tiện nghi để tìm khách sạn có các dịch vụ tôi cần.

#### Acceptance Criteria

1. THE Filter_Modal SHALL hiển thị danh sách tiện nghi từ AMENITY_META: WiFi, Hồ Bơi, Gym, Spa, Nhà hàng, Quầy bar, Breakfast, Parking, AC, Pet friendly, Laundry, Shuttle, Kitchen
2. WHEN người dùng click một tiện nghi, THE Filter_System SHALL toggle trạng thái chọn/bỏ chọn của tiện nghi đó
3. THE Filter_System SHALL cho phép chọn nhiều tiện nghi cùng lúc
4. THE Filter_System SHALL hiển thị icon và label tương ứng cho từng tiện nghi
5. THE Filter_System SHALL hiển thị trạng thái active/inactive bằng màu sắc và styling khác nhau

### Requirement 5: Price Range Filter

**User Story:** Là người dùng, tôi muốn lọc theo khoảng giá để tìm khách sạn phù hợp với ngân sách.

#### Acceptance Criteria

1. THE Filter_Modal SHALL hiển thị các preset khoảng giá: "Dưới 1 triệu", "1-3 triệu", "3-5 triệu", "5-10 triệu", "Trên 10 triệu"
2. WHEN người dùng click một preset, THE Filter_System SHALL thiết lập min_price và max_price tương ứng
3. THE Filter_System SHALL hiển thị khoảng giá hiện tại được chọn
4. THE Filter_System SHALL chỉ cho phép chọn một preset tại một thời điểm
5. THE Filter_System SHALL hiển thị trạng thái active của preset được chọn

### Requirement 6: Available Rooms Filter

**User Story:** Là người dùng, tôi muốn có tùy chọn chỉ hiển thị khách sạn còn phòng trống để tránh mất thời gian.

#### Acceptance Criteria

1. THE Filter_Modal SHALL hiển thị toggle switch "Chỉ hiển thị phòng còn trống"
2. WHEN người dùng toggle switch, THE Filter_System SHALL cập nhật trạng thái availableOnly
3. THE Filter_System SHALL hiển thị trạng thái on/off của toggle switch rõ ràng
4. WHEN availableOnly là true, THE Filter_System SHALL chỉ trả về khách sạn có phòng trống trong khoảng thời gian đã chọn

### Requirement 7: Filter State Management

**User Story:** Là developer, tôi muốn quản lý trạng thái filter trong App_Context để đồng bộ giữa các component.

#### Acceptance Criteria

1. THE App_Context SHALL chứa filter state với các thuộc tính: starRating, types, amenities, priceMin, priceMax, availableOnly
2. WHEN Filter_Modal thay đổi filter, THE App_Context SHALL cập nhật filter state
3. THE Filter_System SHALL khởi tạo filter state với giá trị mặc định hợp lý
4. THE App_Context SHALL cung cấp functions để update từng phần của filter state
5. THE Filter_System SHALL persist filter state trong suốt phiên làm việc của người dùng

### Requirement 8: Backend Integration

**User Story:** Là developer, tôi muốn tích hợp filter với Hotel_Service để gửi search parameters đến backend API.

#### Acceptance Criteria

1. WHEN filter được áp dụng, THE Hotel_Service SHALL gửi request đến /api/v1/discover với filter parameters
2. THE Hotel_Service SHALL chuyển đổi filter state thành search parameters phù hợp với backend API
3. THE Hotel_Service SHALL bao gồm các tham số: min_price, max_price, property_types, amenities, star_rating, available_only
4. WHEN backend trả về kết quả, THE Hotel_Service SHALL normalize dữ liệu và cập nhật hotels trong App_Context
5. THE Filter_System SHALL hiển thị loading state trong quá trình gọi API

### Requirement 9: Filter Results Display

**User Story:** Là người dùng, tôi muốn thấy kết quả được lọc ngay lập tức sau khi áp dụng filter.

#### Acceptance Criteria

1. WHEN filter được áp dụng, THE Hotel_Sidebar SHALL hiển thị số lượng kết quả mới
2. THE Hotel_Sidebar SHALL cập nhật danh sách khách sạn theo kết quả filter
3. WHEN không có kết quả nào, THE Hotel_Sidebar SHALL hiển thị thông báo "No stays found" với gợi ý điều chỉnh filter
4. THE Filter_System SHALL reset về hotel đầu tiên trong danh sách kết quả mới
5. THE Hotel_Sidebar SHALL hiển thị loading state trong quá trình filter

### Requirement 10: Filter Reset and Clear

**User Story:** Là người dùng, tôi muốn có thể reset hoặc clear các filter để bắt đầu tìm kiếm mới.

#### Acceptance Criteria

1. THE Filter_Modal SHALL có chức năng reset về trạng thái mặc định
2. WHEN người dùng clear filter, THE Filter_System SHALL xóa tất cả filter criteria và thực hiện search mới
3. THE Filter_System SHALL cung cấp visual feedback khi filter được reset
4. THE Filter_System SHALL khôi phục về kết quả tìm kiếm ban đầu khi clear filter
5. THE Filter_Modal SHALL hiển thị trạng thái "no filters applied" khi tất cả filter được clear

### Requirement 11: Filter Persistence and URL State

**User Story:** Là người dùng, tôi muốn filter được lưu trữ để không mất khi refresh trang hoặc quay lại.

#### Acceptance Criteria

1. THE Filter_System SHALL lưu filter state vào localStorage khi có thay đổi
2. WHEN người dùng refresh trang, THE Filter_System SHALL khôi phục filter state từ localStorage
3. THE Filter_System SHALL sync filter state với URL parameters để có thể share link
4. WHEN người dùng navigate bằng browser back/forward, THE Filter_System SHALL cập nhật filter state tương ứng
5. THE Filter_System SHALL clear localStorage filter khi người dùng thực hiện search mới với location khác

### Requirement 12: Filter Performance Optimization

**User Story:** Là developer, tôi muốn filter hoạt động mượt mà và không gây lag cho ứng dụng.

#### Acceptance Criteria

1. THE Filter_System SHALL debounce API calls khi người dùng thay đổi filter liên tục
2. THE Filter_System SHALL cache kết quả filter để tránh gọi API không cần thiết
3. WHEN filter state không thay đổi, THE Filter_System SHALL không gọi lại API
4. THE Filter_System SHALL sử dụng React.memo và useMemo để optimize re-rendering
5. THE Filter_Modal SHALL render smooth animations khi mở/đóng và thay đổi state