<div align="center">

<h1>Lodgy4U - Giao diện Tương tác (Frontend)</h1>

<p><strong>Trải nghiệm người dùng thông minh, mượt mà và trực quan cho nền tảng lưu trú AI</strong></p>

<br/>

<a href="https://github.com/KhoaTapCode2006/FE_TDTT_REACT"><img src="https://img.shields.io/badge/Frontend%20Repo-181717?style=for-the-badge&logo=github&logoColor=white" /></a>
<a href="https://github.com/HauBaka/T04_TDTT"><img src="https://img.shields.io/badge/Backend%20Repo-181717?style=for-the-badge&logo=github&logoColor=white" /></a>
<a href="#hướng-dẫn-cài-đặt"><img src="https://img.shields.io/badge/Bắt%20đầu%20ngay-22c55e?style=for-the-badge&logo=rocket&logoColor=white" /></a>

<br/><br/>

<img src="https://img.shields.io/badge/Framework-React%2018-20232A?style=flat-square&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/Build%20Tool-Vite-B73BFE?style=flat-square&logo=vite&logoColor=FFD62E" />
<img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" />
<img src="https://img.shields.io/badge/State-Context%20API-764ABC?style=flat-square&logo=redux&logoColor=white" />
<img src="https://img.shields.io/badge/Realtime-Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black" />
<img src="https://img.shields.io/badge/Bản%20đồ-VietMap%20GL-1a73e8?style=flat-square&logo=googlemaps&logoColor=white" />
<img src="https://img.shields.io/badge/Trạng%20thái-Đang%20phát%20triển-22c55e?style=flat-square" />

<br/><br/>

> **Lodgy4U Frontend** mang đến một trải nghiệm người dùng (UX) hiện đại, phản hồi tức thì với hệ thống component được module hóa cao, kết hợp giữa bản đồ tương tác, khung chat AI thời gian thực và quản lý trạng thái toàn cục.

</div>

---

## Giới thiệu

> [!NOTE]
> Repository này chứa toàn bộ mã nguồn giao diện người dùng (Client-side) của hệ thống Lodgy4U. Được xây dựng trên nền tảng React và Vite nhằm tối ưu hóa tối đa thời gian tải trang và độ mượt mà của các hiệu ứng (Animations).

Kiến trúc Frontend được thiết kế tập trung vào tính trực quan, tái sử dụng component và khả năng đồng bộ dữ liệu thời gian thực thông qua các thành phần cốt lõi sau:

<table width="100%" style="border-collapse: collapse; margin-top: 15px;">
  <tr>
    <td style="padding: 12px 15px; border-left: 4px solid #61dafb; background-color: #161b22; border-radius: 0 6px 6px 0; margin-bottom: 10px; display: block;">
      <strong>Giao diện Chatbot Trực quan:</strong> Ứng dụng custom hook <code>useTypewriter</code> tạo hiệu ứng gõ chữ tự nhiên cho AI, đồng thời cho phép hiển thị các thẻ (Cards) khách sạn tương tác ngay bên trong luồng tin nhắn.
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 15px; border-left: 4px solid #38b2ac; background-color: #161b22; border-radius: 0 6px 6px 0; margin-bottom: 10px; display: block;">
      <strong>Hệ thống Popup Toàn cục (Global Modal):</strong> Quản lý trạng thái <code>activeHotel</code> qua Context API, cho phép bung mở thông tin chi tiết khách sạn từ bất kỳ trang nào (Trang chủ, Bộ sưu tập, Bản đồ) mà không làm gián đoạn luồng người dùng.
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 15px; border-left: 4px solid #ffca28; background-color: #161b22; border-radius: 0 6px 6px 0; margin-bottom: 10px; display: block;">
      <strong>Đồng bộ Realtime & Tracking:</strong> Tích hợp Firebase SDK để lắng nghe và cập nhật vị trí GPS của các thành viên trong nhóm theo thời gian thực, hiển thị cảnh báo ngay lập tức khi có người mất tín hiệu.
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 15px; border-left: 4px solid #ff7b72; background-color: #161b22; border-radius: 0 6px 6px 0; margin-bottom: 10px; display: block;">
      <strong>Bản đồ Tương tác Động:</strong> Nhúng bản đồ hệ tọa độ cao kết hợp cluster marker, cho phép người dùng kéo thả, phân vùng tìm kiếm và trực quan hóa khoảng cách địa lý một cách mượt mà.
    </td>
  </tr>
  <tr>
    <td style="padding: 12px 15px; border-left: 4px solid #b73bfe; background-color: #161b22; border-radius: 0 6px 6px 0; margin-bottom: 0; display: block;">
      <strong>Tối ưu Trải nghiệm (Performance):</strong> Áp dụng <code>Request Deduplicator</code> để chống spam API, kết hợp cơ chế caching hình ảnh (Image Cache) và CSS Modules để ngăn chặn xung đột giao diện, giữ cho ứng dụng luôn đạt tốc độ 60fps.
    </td>
  </tr>
</table>

---

## Tính năng chính (Góc độ UI/UX)

<table width="100%" style="border-collapse: separate; border-spacing: 15px; max-width: 100%;">
  
  <tr>
    <td width="50%" valign="top" style="padding: 16px; border: 1px solid #30363d; border-radius: 8px; background-color: #0d1117;">
      <h3 style="margin-top: 0; color: #61dafb;">✨ Trải nghiệm Trò chuyện Liền mạch</h3>
      <p style="color: #8b949e; font-size: 13.5px; margin-bottom: 0; line-height: 1.6; text-align: justify;">
        Khu vực Chat được thiết kế nổi bật với các bong bóng tin nhắn phân cấp rõ ràng. Người dùng có thể click trực tiếp vào các gợi ý của AI để xem popup chi tiết mà không cần phải chuyển trang.
      </p>
    </td>
    <td width="50%" valign="top" style="padding: 16px; border: 1px solid #30363d; border-radius: 8px; background-color: #0d1117;">
      <h3 style="margin-top: 0; color: #61dafb;">🎨 Trực quan hóa Dữ liệu AI</h3>
      <p style="color: #8b949e; font-size: 13.5px; margin-bottom: 0; line-height: 1.6; text-align: justify;">
        Biến những dữ liệu phân tích cảm xúc khô khan từ Backend thành các thanh điểm số sinh động, huy hiệu cảnh báo (Spam/Uy tín), và các box tóm tắt ưu/nhược điểm dễ đọc, thân thiện với mắt người nhìn.
      </p>
    </td>
  </tr>

  <tr>
    <td width="50%" valign="top" style="padding: 16px; border: 1px solid #30363d; border-radius: 8px; background-color: #0d1117;">
      <h3 style="margin-top: 0; color: #61dafb;">📁 Quản lý Bộ sưu tập Thông minh</h3>
      <p style="color: #8b949e; font-size: 13.5px; margin-bottom: 0; line-height: 1.6; text-align: justify;">
        Giao diện Dashboard cho phép lưu trữ, phân loại địa điểm yêu thích bằng hệ thống Tab điều hướng mượt mà. Tích hợp cầu nối dữ liệu (Mappers) giúp bung mở Popup chi tiết đầy đủ thông tin từ bất kỳ bộ sưu tập nào.
      </p>
    </td>
    <td width="50%" valign="top" style="padding: 16px; border: 1px solid #30363d; border-radius: 8px; background-color: #0d1117;">
      <h3 style="margin-top: 0; color: #61dafb;">📱 Không gian Nhóm Thời gian thực</h3>
      <p style="color: #8b949e; font-size: 13.5px; margin-bottom: 0; line-height: 1.6; text-align: justify;">
        Giao diện Trip Dashboard cung cấp bản đồ định vị các thành viên đang di chuyển (Live Tracking) kết hợp cùng khung Group Chat nhỏ gọn, giúp nhóm bạn bè dễ dàng tương tác và nắm bắt tình hình của nhau.
      </p>
    </td>
  </tr>

  <tr>
    <td width="50%" valign="top" style="padding: 16px; border: 1px solid #30363d; border-radius: 8px; background-color: #0d1117;">
      <h3 style="margin-top: 0; color: #61dafb;">🗺️ Bản đồ Khám phá Tương tác</h3>
      <p style="color: #8b949e; font-size: 13.5px; margin-bottom: 0; line-height: 1.6; text-align: justify;">
        Tích hợp thư viện bản đồ VietMap GL với cụm điểm (Cluster Markers) hiệu năng cao. Người dùng có thể dễ dàng trực quan hóa các địa điểm trong Bộ sưu tập hoặc Chuyến đi ngay trên nền bản đồ số.
      </p>
    </td>
    <td width="50%" valign="top" style="padding: 16px; border: 1px solid #30363d; border-radius: 8px; background-color: #0d1117;">
      <h3 style="margin-top: 0; color: #61dafb;">⚡ Kiến trúc Component Độc lập</h3>
      <p style="color: #8b949e; font-size: 13.5px; margin-bottom: 0; line-height: 1.6; text-align: justify;">
        Sử dụng cấu trúc Domain-Driven Design. Các component lớn như `HotelPopup` được thiết kế dưới dạng Global State, cho phép tái sử dụng ở mọi nơi (Search, Map, Collection) mà không lo xung đột giao diện.
      </p>
    </td>
  </tr>

</table>

---

## Công nghệ Frontend sử dụng

<table width="100%">
  <tr>
    <td width="50%" valign="top" style="padding: 15px; border: 1px solid #30363d; border-radius: 6px;">
      <h3><a href="#" style="text-decoration: none; color: #61dafb;">Core Framework</a></h3>
      <p style="color: #8b949e; font-size: 14px; min-height: 80px;">
        Trái tim của ứng dụng được vận hành bởi React phiên bản mới nhất, kết hợp công cụ Build tốc độ cao Vite và hệ thống định tuyến trang linh hoạt.
      </p>
      <br />
      <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" /></a>
      <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-B73BFE?style=flat-square&logo=vite&logoColor=FFD62E" /></a>
      <a href="https://reactrouter.com/"><img src="https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=react-router&logoColor=white" /></a>
      <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript_ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black" /></a>
    </td>
    <td width="50%" valign="top" style="padding: 15px; border: 1px solid #30363d; border-radius: 6px;">
      <h3><a href="#" style="text-decoration: none; color: #61dafb;">Styling & UI Components</a></h3>
      <p style="color: #8b949e; font-size: 14px; min-height: 80px;">
        Hệ thống giao diện được thiết kế hiện đại, tùy biến cao bằng utility-first CSS, kết hợp với các hiệu ứng chuyển động và thư viện icon đồng bộ.
      </p>
      <br />
      <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" /></a>
      <a href="https://github.com/css-modules/css-modules"><img src="https://img.shields.io/badge/CSS_Modules-000000?style=flat-square&logo=css3&logoColor=white" /></a>
      <a href="https://lucide.dev/"><img src="https://img.shields.io/badge/Lucide_Icons-F05032?style=flat-square" /></a>
    </td>
  </tr>
  
  <tr>
    <td width="50%" valign="top" style="padding: 15px; border: 1px solid #30363d; border-radius: 6px;">
      <h3><a href="#" style="text-decoration: none; color: #61dafb;">API & State Management</a></h3>
      <p style="color: #8b949e; font-size: 14px; min-height: 80px;">
        Quản lý luồng dữ liệu trung tâm, tự động đính kèm Token bảo mật qua Interceptors và xử lý các trạng thái tải trang (Loading/Error/Success) một cách tinh tế.
      </p>
      <br />
      <a href="https://axios-http.com/"><img src="https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white" /></a>
      <a href="https://react.dev/reference/react/createContext"><img src="https://img.shields.io/badge/Context_API-764ABC?style=flat-square&logo=react&logoColor=white" /></a>
      <a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage"><img src="https://img.shields.io/badge/Local_Storage-E34F26?style=flat-square" /></a>
    </td>
    <td width="50%" valign="top" style="padding: 15px; border: 1px solid #30363d; border-radius: 6px;">
      <h3><a href="#" style="text-decoration: none; color: #61dafb;">External SDKs & Map</a></h3>
      <p style="color: #8b949e; font-size: 14px; min-height: 80px;">
        Tích hợp các bộ công cụ mạnh mẽ từ bên thứ ba để xử lý xác thực bảo mật, cơ sở dữ liệu thời gian thực và nền tảng bản đồ số Việt Nam.
      </p>
      <br />
      <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase_Realtime-FFCA28?style=flat-square&logo=firebase&logoColor=black" /></a>
      <a href="https://firebase.google.com/docs/auth"><img src="https://img.shields.io/badge/Firebase_Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black" /></a>
      <a href="https://maps.vietmap.vn/"><img src="https://img.shields.io/badge/VietMap_GL-1a73e8?style=flat-square&logo=googlemaps&logoColor=white" /></a>
    </td>
  </tr>
</table>

---

## Cấu trúc thư mục

📂 **[FE_TDTT_REACT](.)/**

<details>
<summary>📁 <code>src/components</code>/ — <em>Các thành phần giao diện (UI components) dùng chung có khả năng tái sử dụng</em></summary>

- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> `auth/` — *Giao diện đăng nhập, đăng ký, quên mật khẩu và Component bảo vệ các luồng truy cập*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> `autocomplete/` — *Thanh tìm kiếm nâng cao có gợi ý tự động cho địa chỉ và khách sạn*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> `chat/` — *Các thành phần hiển thị tin nhắn, bong bóng chat và giao diện khu vực nhắn tin*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> `collection/` — *Giao diện thẻ bộ sưu tập, danh sách địa điểm và mời thành viên nhóm*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> `filter/` — *Hệ thống bộ lọc tìm kiếm theo giá cả, tiện nghi, loại phòng và xếp hạng sao*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> `hotel/` — *Thẻ khách sạn, danh sách hiển thị và Popup chi tiết thông tin tràn viền*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> `layout/` — *Các thành phần khung cố định của trang web như Header, Footer, Sidebar*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> `map/` — *Tích hợp bản đồ VietMap để hiển thị vị trí lưu trú trực quan*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> `profile/` — *Giao diện hồ sơ cá nhân, đánh giá sở thích du lịch và danh sách yêu thích*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> `ui/` — *Các UI component nguyên thủy dùng chung (Icons, Toggle, Spliter, DatePicker)*
- - <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> `search/` — *Component dùng để tìm kiếm lưu trú dựa trên các yêu cầu của người dùng*

</details>

<details>
<summary>📁 <code>src/features</code>/ — <em>Các module tính năng nghiệp vụ cốt lõi (Domain-Driven Design)</em></summary>

- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> `chat/` — *Toàn bộ logic, components và hooks quản lý hệ thống Group Chat thời gian thực*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> `trip/` — *Module quản lý chuyến đi, lập lịch trình, tracking định vị GPS nhóm và theo dõi sự cố (tai nạn, mất kết nối)*

</details>

<details>
<summary>📁 <code>src/pages</code> & <code>layouts</code>/ — <em>Các trang giao diện chính và cấu trúc bố cục</em></summary>

- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> [`layouts/MainLayout.jsx`](src/layouts/MainLayout.jsx) — *Khung layout tổng bọc toàn bộ trang chính và chứa Global Popups*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> [`pages/HomePage.jsx`](src/pages/HomePage.jsx) — *Trang chủ hiển thị thanh tìm kiếm và gợi ý danh sách lưu trú*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> [`pages/IntroPage.jsx`](src/pages/IntroPage.jsx) — *Trang giới thiệu tính năng và hướng dẫn nền tảng (Landing Page)*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> [`pages/GroupChatPage.jsx`](src/pages/GroupChatPage.jsx) — *Giao diện không gian chat nhóm để mọi người cùng thảo luận*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> [`pages/TripPage.jsx`](src/pages/TripPage.jsx) — *Bảng điều khiển chi tiết lộ trình chuyến đi và xem bản đồ vị trí nhóm*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> `pages/collection/` — *Trang Dashboard quản lý bộ sưu tập và chi tiết từng bộ sưu tập cụ thể*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> `pages/profile/` — *Các màn hình quản lý thông tin tài khoản, khách sạn đã lưu và phòng đã đặt*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> `pages/auth/` — *Các màn hình truy cập cho đăng nhập, đăng ký và khôi phục mật khẩu*

</details>

<details>
<summary>📁 <code>src/services</code>/ — <em>Tầng xử lý giao tiếp dữ liệu với Backend API và Firebase</em></summary>

- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> [`api/apiClient.js`](src/services/api/apiClient.js) — *Cấu hình Axios base, tự động gắn JWT Token và interceptor xử lý lỗi HTTP*
- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> `auth/` — *Service xử lí đăng nhập, đăng kí bằng email, Google*
- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> `backend/` — *Các Service tương tác với REST API nội bộ (chat, collection, discover, hotel, trip, upload)*
- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> `external/` — *Gọi API của các dịch vụ bên thứ ba (Hệ thống gợi ý địa chỉ, bản đồ VietMap)*
- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> `firebase/` — *Service đẩy tọa độ định vị GPS liên tục theo thời gian thực (Realtime Tracking)*
- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> `profile/` — *Service fetch thông tin cá nhân, lịch sử lưu trú, danh sách yêu thích và bộ sưu tập cá nhân*
- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> `trip/` — *Service lưu trữ trạng thái hành trình, dọn dẹp kết nối mạng và quản lý theo dõi nhóm*

</details>

<details>
<summary>📁 <code>src/contexts</code> & <code>hooks</code>/ & <code>app</code>/— <em>Quản lý State toàn cục và Custom Logic Hooks</em></summary>

- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> [`app/AppContext.jsx`](src/app/AppContext.jsx) — *Context bao bọc ứng dụng, quản lý trạng thái khách sạn đang xem chung (Global Popups)*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> [`app/router.jsx`](src/app/router.jsx) — *Import các components và định nghĩa đường dẫn tới các trang tương ứng*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> [`contexts/AuthContext.jsx`](src/contexts/AuthContext.jsx) — *Context quản lý phiên đăng nhập (Session) và thông tin tài khoản người dùng*
- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> [`hooks/useTypewriter.js`](src/hooks/useTypewriter.js) — *Custom Hook xử lý hiệu ứng gõ chữ mượt mà cho tin nhắn giải thích của Chatbot*
- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> [`hooks/useImageCache.js`](src/hooks/useImageCache.js) — *Custom Hook lưu trữ bộ nhớ đệm hình ảnh nhằm tối ưu thời gian tải trải nghiệm UI*

</details>

<details>
<summary>📁 <code>src/utils</code> & <code>config</code>/ — <em>Công cụ tiện ích và cấu hình hệ thống</em></summary>

- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> [`config/firebase.js`](src/config/firebase.js) — *Tệp cấu hình kết nối SDK Firebase cho tính năng Authenticate và Realtime Database*
- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> [`utils/collectionPlaceMapper.js`](src/utils/collectionPlaceMapper.js) — *Đồng bộ và định dạng chuẩn hóa data khách sạn từ API vào giao diện Frontend*
- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> [`utils/schemaTransformers.js`](src/utils/schemaTransformers.js) — *Công cụ chuyển đổi cấu trúc key liên tục giữa `snake_case` (Backend) và `camelCase` (Frontend)*
- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> [`utils/format.js`](src/utils/format.js) — *Hàm format chuyên dụng cho xử lý hiển thị tiền tệ (VND), ngày tháng, và view counts*
- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> [`utils/tokenManager.js`](src/utils/tokenManager.js) — *Quản lý việc tự động cấp mới, lưu trữ local JWT Authentication Token*
- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> [`utils/requestDeduplicator.js`](src/utils/requestDeduplicator.js) — *Giải pháp ngăn chặn gọi API liên tiếp cùng lúc làm nghẽn/tăng chi phí băng thông*

</details>

<details>
<summary>📁 <code>src/constants</code> & <code>assets</code>/ — <em>Các file constants, hình ảnh, label, và module css chung </em></summary>

- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> [`assets/styles`] — *Module CSS dùng chung cho cả dự án*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> [`assets/`](src/app/router.jsx) — *Các file hình ảnh dùng chung*
- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> [`constants/`] — *Chứa các biến cố định toàn cục định nghĩa modal và label của filter, hotels.*
- 
</details>

<details>
<summary>📁 <em>Cấu hình dự án (Root)</em></summary>

- <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="14" /> [`src/main.jsx`](src/main.jsx) — *File Entrypoint khởi động React Tree và khai báo Router Provider trung tâm*
- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> [`vite.config.js`](vite.config.js) — *Tệp cấu hình Bundler Vite tối ưu hoá tốc độ build và proxy cho dev server*
- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> [`tailwind.config.js`](tailwind.config.js) — *Hệ thống file design system: khai báo màu sắc, typography và spacing của Tailwind CSS*
- <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Unofficial_JavaScript_logo_2.svg" width="14" /> [`eslint.config.js`](eslint.config.js) — *Quy chuẩn linter kiểm soát lỗi cú pháp nghiêm ngặt trong quá trình viết code React*
- 📄 `package.json` — *Danh sách khai báo toàn bộ thư viện npm và các lệnh chạy dự án (scripts)*

</details>

## Hướng dẫn cài đặt

> [!IMPORTANT]
> Đảm bảo đã có đủ các API key bên dưới trước khi chạy. Thiếu bất kỳ key nào có thể khiến một số tính năng không hoạt động.

### Yêu cầu

<img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white" />
<img src="https://img.shields.io/badge/Firebase-Firestore%20enabled-FFCA28?style=flat-square&logo=firebase&logoColor=black" />
<img src="https://img.shields.io/badge/Redis-tuỳ%20chọn-DC382D?style=flat-square&logo=redis&logoColor=white" />

### Các bước cài đặt

```bash
# 1. Clone repository
git clone https://github.com/KhoaTapCode2006/FE_TDTT_REACT.git
cd FE_TDTT_REACT

# 2. Tạo môi trường ảo
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Cài đặt thư viện
pip install -r requirements.txt

# 4. Cấu hình môi trường
cp .env.example .env
# Điền các giá trị vào file .env (xem mục bên dưới)

# 5. Khởi động frontend
npm run dev

```

### Cấu hình `.env`

```dotenv
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=yourauthdomain.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://yoururlfirebasedatabase.firebasedatabase.app/
VITE_FIREBASE_PROJECT_ID=yourprojectid
VITE_FIREBASE_STORAGE_BUCKET=yourfirebase.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=yourfirebasemessagingID
VITE_FIREBASE_APP_ID=yourfirebaseAppID
VITE_FIREBASE_MEASUREMENT_ID=yourfirebaseMeasurementID

VITE_LOCAL_API=YourBackendAPIURL

# Development Environment
NODE_ENV=development

```

---

## Thành viên Frontend

<table width="100%" style="border-collapse: collapse;">
  <tr>
    <td width="50%" valign="top" style="padding: 15px; border: 1px solid #30363d;">
      <table style="border: none; margin: 0; padding: 0;">
        <tr>
          <td valign="middle" style="border: none; padding: 0 12px 0 0;">
            <img src="https://images.weserv.nl/?url=github.com/HauBaka.png&w=70&h=70&mask=circle" width="70" height="70" />
          </td>
          <td valign="middle" style="border: none; padding: 0; line-height: 1.4;">
            <strong style="font-size: 16px; color: #58a6ff;">Trần Nguyễn Anh Khoa</strong><br/>
            <a href="https://github.com/KhoaTapCode2006" style="font-size: 13px; color: #8b949e; text-decoration: none;">@KhoaTapCode2006</a><br/>
            <span style="font-size: 13px; color: #8b949e;">24120075</span>
          </td>
        </tr>
      </table>
      <p style="font-size: 13.5px; color: #c9d1d9; margin-top: 12px; line-height: 1.5; text-align: justify;">
        Trưởng nhóm Frontend. Thiết kế và xây dựng hiển thị trang chủ và lưu trú, xây dựng chức năng xử lí dữ liệu lưu trú từ Backend, xây dựng các tính năng đăng kí, đăng nhập, tài khoản, lưu khách sạn yêu thích.
      </p>
    </td>
    <td width="50%" valign="top" style="padding: 15px; border: 1px solid #30363d;">
      <table style="border: none; margin: 0; padding: 0;">
        <tr>
          <td valign="middle" style="border: none; padding: 0 12px 0 0;">
            <img src="https://images.weserv.nl/?url=github.com/tuan0306.png&w=70&h=70&mask=circle" width="70" height="70" />
          </td>
          <td valign="middle" style="border: none; padding: 0; line-height: 1.4;">
            <strong style="font-size: 16px; color: #58a6ff;">Lê Nguyễn Gia Huy</strong><br/>
            <a href="https://github.com/tuan0306" style="font-size: 13px; color: #8b949e; text-decoration: none;">@tuan0306</a><br/>
            <span style="font-size: 13px; color: #8b949e;">24120061</span>
          </td>
        </tr>
      </table>
      <p style="font-size: 13.5px; color: #c9d1d9; margin-top: 12px; line-height: 1.5; text-align: justify;">
        #Cong viec ơ day
      </p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top" style="padding: 15px; border: 1px solid #30363d;">
      <table style="border: none; margin: 0; padding: 0;">
        <tr>
          <td valign="middle" style="border: none; padding: 0 12px 0 0;">
            <img src="https://images.weserv.nl/?url=github.com/DTDuong275.png&w=70&h=70&mask=circle" width="70" height="70" />
          </td>
          <td valign="middle" style="border: none; padding: 0; line-height: 1.4;">
            <strong style="font-size: 16px; color: #58a6ff;"></strong><br/>
            <a href="https://github.com/DTDuong275" style="font-size: 13px; color: #8b949e; text-decoration: none;">@</a><br/>
            <span style="font-size: 13px; color: #8b949e;"></span>
          </td>
        </tr>
      </table>
      <p style="font-size: 13.5px; color: #c9d1d9; margin-top: 12px; line-height: 1.5; text-align: justify;">
       #Cong viec ơ da
      </p>
    </td>
    <td width="50%" valign="top" style="border: none; background: transparent;"></td>
  </tr>
</table>

---

<div align="center">

<img src="https://img.shields.io/badge/Nhóm%2004-CSC10014-1a1a2e?style=for-the-badge" />
<img src="https://img.shields.io/badge/KHTN-ĐHQG--HCM-003087?style=for-the-badge" />

</div>

