# Invalid Escape Sequence Fix Design

## Overview

Sửa lỗi JavaScript parse error do invalid Unicode escape sequence trong file `src/services/backend/backend-data.service.js`. Lỗi xảy ra khi chuỗi `\hotel-\\` được sử dụng làm fallback value cho property `id`, gây ra lỗi parse và ngăn ứng dụng chạy bình thường. Giải pháp là thay thế chuỗi không hợp lệ này bằng một fallback ID hợp lệ.

## Glossary

- **Bug_Condition (C)**: Điều kiện kích hoạt lỗi - khi property_token là null/undefined và chuỗi fallback `\hotel-\\` được sử dụng
- **Property (P)**: Hành vi mong muốn - sử dụng fallback ID hợp lệ không gây lỗi parse
- **Preservation**: Hành vi hiện tại với property_token hợp lệ và các chức năng transform khác phải được giữ nguyên
- **transformBackendHotel**: Function trong `src/services/backend/backend-data.service.js` thực hiện transform dữ liệu hotel từ backend format sang app format
- **property_token**: Thuộc tính ID của hotel từ backend data, có thể null/undefined

## Bug Details

### Bug Condition

Lỗi xảy ra khi JavaScript engine parse file `backend-data.service.js` và gặp chuỗi `\hotel-\\` không hợp lệ. Chuỗi này chứa escape sequence không đúng định dạng Unicode, gây ra parse error ngay từ giai đoạn compile/build.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type BackendHotelData
  OUTPUT: boolean
  
  RETURN input.property_token IS NULL OR input.property_token IS UNDEFINED
         AND fallbackString CONTAINS invalid escape sequence "\hotel-\\"
         AND JavaScript parser encounters this string during compilation
END FUNCTION
```

### Examples

- **Lỗi Parse**: Khi JavaScript engine đọc dòng 85: `id: property_token || \hotel-\\,` → SyntaxError: Invalid Unicode escape sequence
- **Build Failure**: Khi chạy `npm run build` hoặc `npm run dev` → Build process fails với parse error
- **Runtime Error**: Ứng dụng không thể khởi động do lỗi syntax trong source code
- **Edge Case**: Ngay cả khi property_token có giá trị hợp lệ, lỗi parse vẫn xảy ra vì JavaScript engine không thể parse file

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Khi property_token có giá trị hợp lệ, hệ thống phải tiếp tục sử dụng property_token làm ID
- Function transformBackendHotel phải tiếp tục transform dữ liệu chính xác như trước với tất cả thuộc tính khác
- Các hotel objects khác phải tiếp tục được xử lý bình thường

**Scope:**
Tất cả các trường hợp mà property_token KHÔNG phải null/undefined sẽ hoàn toàn không bị ảnh hưởng bởi fix này. Bao gồm:
- Hotels với property_token hợp lệ
- Các thuộc tính khác của hotel object (name, price, amenities, etc.)
- Logic transform cho các thuộc tính khác

## Hypothesized Root Cause

Dựa trên phân tích lỗi, nguyên nhân chính là:

1. **Invalid Escape Sequence Syntax**: Chuỗi `\hotel-\\` không tuân theo quy tắc escape sequence của JavaScript
   - `\h` không phải là escape sequence hợp lệ
   - `\\` ở cuối tạo ra confusion trong parsing

2. **Missing String Quotes**: Chuỗi fallback không được bao quanh bởi quotes
   - JavaScript parser coi `\hotel-\\` là một identifier với escape sequence
   - Thay vì là một string literal

3. **Incorrect Fallback Value Format**: Fallback value không đúng định dạng ID
   - Không phải string literal hợp lệ
   - Chứa ký tự đặc biệt không được escape đúng cách

4. **Copy-Paste Error**: Có thể là lỗi copy-paste từ source khác hoặc typo khi viết code

## Correctness Properties

Property 1: Bug Condition - Valid Fallback ID Generation

_For any_ backend hotel data where property_token is null or undefined, the fixed transformBackendHotel function SHALL generate a valid fallback ID that does not cause JavaScript parse errors and allows the application to build and run successfully.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Existing Property Token Usage

_For any_ backend hotel data where property_token has a valid value (not null/undefined), the fixed function SHALL produce exactly the same result as the original function, preserving the use of property_token as the ID and all other transformation logic.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/services/backend/backend-data.service.js`

**Function**: `transformBackendHotel`

**Specific Changes**:
1. **Fix String Literal Syntax**: Thay thế `\hotel-\\` bằng một string literal hợp lệ
   - Sử dụng quotes để bao quanh string
   - Đảm bảo không có invalid escape sequences

2. **Generate Valid Fallback ID**: Tạo fallback ID có ý nghĩa và unique
   - Sử dụng format như `"hotel-unknown-${index}"` hoặc `"hotel-fallback-${Date.now()}"`
   - Đảm bảo ID là unique để tránh conflict

3. **Maintain Backward Compatibility**: Đảm bảo logic fallback không ảnh hưởng đến cases khác
   - Giữ nguyên logic `property_token ||` 
   - Chỉ thay đổi fallback value

4. **Add Input Validation**: Thêm validation để handle edge cases
   - Check property_token validity
   - Ensure fallback ID generation is robust

5. **Update Documentation**: Thêm comment giải thích fallback logic
   - Explain why fallback is needed
   - Document the ID format used

## Testing Strategy

### Validation Approach

Testing strategy theo hai giai đoạn: đầu tiên, surface counterexamples để demonstrate lỗi trên unfixed code, sau đó verify fix hoạt động đúng và preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples để demonstrate lỗi TRƯỚC KHI implement fix. Confirm hoặc refute root cause analysis. Nếu refute, sẽ cần re-hypothesize.

**Test Plan**: Viết tests để parse file JavaScript với invalid escape sequence và assert rằng parse error xảy ra. Run tests này trên UNFIXED code để observe failures và hiểu root cause.

**Test Cases**:
1. **Parse Error Test**: Attempt to parse file với `\hotel-\\` syntax (will fail on unfixed code)
2. **Build Process Test**: Run build command và expect failure (will fail on unfixed code)  
3. **Runtime Import Test**: Try to import module và expect syntax error (will fail on unfixed code)
4. **Null Property Token Test**: Call transformBackendHotel với property_token = null (cannot run on unfixed code due to parse error)

**Expected Counterexamples**:
- JavaScript parse errors khi load file
- Possible causes: invalid escape sequence syntax, missing quotes, malformed string literal

### Fix Checking

**Goal**: Verify rằng với tất cả inputs mà bug condition holds, fixed function produces expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := transformBackendHotel_fixed(input)
  ASSERT validFallbackIdGenerated(result)
  ASSERT noParseErrors()
END FOR
```

### Preservation Checking

**Goal**: Verify rằng với tất cả inputs mà bug condition KHÔNG hold, fixed function produces same result như original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT transformBackendHotel_original(input) = transformBackendHotel_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing được recommend cho preservation checking vì:
- Tự động generate nhiều test cases across input domain
- Catch edge cases mà manual unit tests có thể miss
- Provide strong guarantees rằng behavior unchanged cho tất cả non-buggy inputs

**Test Plan**: Observe behavior trên UNFIXED code first cho valid property_tokens, sau đó write property-based tests capturing behavior đó.

**Test Cases**:
1. **Valid Property Token Preservation**: Verify rằng hotels với valid property_token continue to use that token as ID
2. **Transformation Logic Preservation**: Verify rằng tất cả other properties (name, price, amenities, etc.) continue to transform correctly
3. **Array Processing Preservation**: Verify rằng transformBackendResponse continues to process arrays correctly
4. **Edge Case Preservation**: Verify rằng empty/invalid hotel objects continue to be filtered out correctly

### Unit Tests

- Test transformBackendHotel với property_token = null và expect valid fallback ID
- Test transformBackendHotel với property_token = undefined và expect valid fallback ID  
- Test rằng valid property_tokens continue to be used as-is
- Test rằng fallback IDs are unique khi called multiple times

### Property-Based Tests

- Generate random hotel objects với valid property_tokens và verify preservation of ID usage
- Generate random hotel objects với null/undefined property_tokens và verify valid fallback ID generation
- Test across many scenarios rằng all other transformation logic remains unchanged

### Integration Tests

- Test full file parsing và module import after fix
- Test build process completes successfully after fix
- Test rằng application starts và runs normally after fix
- Test hotel data transformation trong full application context