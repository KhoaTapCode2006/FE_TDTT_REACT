# Collection Service Logic Fixes

## Tóm tắt các thay đổi

### 1. ✅ Sửa `create_collection` (collection_service.py)
**Vấn đề:** Tự động thêm owner vào danh sách collaborators khi tạo collection mới.

**Giải pháp:** Xóa dòng code `await self.add_collaborators_to_collection(created_collection["id"], user_id, [user_id])`.

**Lý do:** Owner không cần nằm trong danh sách collaborators vì họ đã có toàn quyền mặc định.

---

### 2. ✅ Sửa `add_collaborators_to_collection` (collection_service.py)
**Vấn đề:** 
- Cho phép thêm owner vào danh sách collaborators
- Báo lỗi `NotFoundError` khi UID không tồn tại trong DB

**Giải pháp:**
- Thêm logic lọc: `filtered_uids = [uid for uid in collaborator_uids if uid != owner_uid]`
- Nếu sau khi lọc không còn UID nào, raise lỗi: "Cannot add owner as collaborator. Owner already has full permissions."
- Thêm TODO comment cho việc tự động tạo profile từ Firebase Auth (chưa implement)

**Lý do:** 
- Owner luôn có toàn quyền, không cần thêm vào collaborators
- Trong tương lai có thể tự động tạo profile cho user mới từ Firebase Auth

---

### 3. ✅ Sửa quyền thêm/xóa Places (collection_service.py)
**Vấn đề:** Logic kiểm tra quyền không rõ ràng về việc owner luôn có quyền.

**Giải pháp:** 
- Thêm comment rõ ràng: "Owner luôn có quyền, hoặc phải là collaborator"
- Giữ nguyên logic: `if requester_id != owner_uid and requester_id not in collaborators_ids:`

**Các hàm được cập nhật:**
- `add_places_to_collection`
- `remove_places_from_collection`

**Lý do:** Đảm bảo owner luôn được thông qua dù họ có trong danh sách collaborators hay không.

---

### 4. ✅ Sửa `add_places_to_collection` (collection_repo.py)
**Vấn đề:** Khi owner thêm place, code cố gắng update `contributed_count` trong sub-collection `collaborators`, nhưng owner không có trong đó → crash.

**Giải pháp:**
```python
# Kiểm tra xem requester có phải là collaborator không trước khi update
collab_ref = ref.collection("collaborators").document(requester_id)
collab_snapshot = await collab_ref.get()

# Chỉ update contributed_count nếu requester là collaborator
if collab_snapshot.exists:
    batch.update(collab_ref, {
        "contributed_count": fs.Increment(len(new_place_ids))
    })
```

**Lý do:** Tránh lỗi khi owner (không nằm trong collaborators) thêm places.

---

### 5. ✅ Sửa `remove_places_from_collection` (collection_repo.py)
**Vấn đề:** Tương tự như trên, khi xóa place do owner thêm, code cố gắng giảm `contributed_count` của owner trong collaborators → crash.

**Giải pháp:**
```python
# Kiểm tra xem người đã thêm place có phải là collaborator không
for doc in docs:
    if doc.exists and doc.id in existing_docs:
        place_data = doc.to_dict() or {}
        added_by = place_data.get("added_by")
        if added_by:
            collab_ref = ref.collection("collaborators").document(added_by)
            collab_snapshot = await collab_ref.get()
            if collab_snapshot.exists:
                batch.update(collab_ref, {
                    "contributed_count": fs.Increment(-1)
                })
```

**Lý do:** Chỉ update `contributed_count` nếu người đã thêm place là collaborator (có trong sub-collection).

---

## Kết quả

✅ Owner không còn bị thêm vào danh sách collaborators khi tạo collection  
✅ Không thể thêm owner vào danh sách collaborators  
✅ Owner luôn có toàn quyền thêm/xóa places mà không cần nằm trong collaborators  
✅ Không còn lỗi crash khi owner thêm/xóa places  
✅ `contributed_count` chỉ được update cho collaborators, không phải owner  

---

## Testing Checklist

- [ ] Tạo collection mới → kiểm tra owner không nằm trong collaborators
- [ ] Owner thêm place → không crash, place được thêm thành công
- [ ] Owner xóa place → không crash, place được xóa thành công
- [ ] Thử thêm owner vào collaborators → nhận lỗi "Cannot add owner as collaborator"
- [ ] Collaborator thêm place → `contributed_count` tăng
- [ ] Collaborator xóa place → `contributed_count` giảm
- [ ] Owner thêm place → `contributed_count` không thay đổi (vì owner không có trong collaborators)

---

## TODO (Future Improvements)

1. **Auto-create user profiles from Firebase Auth:**
   - Khi thêm collaborator với UID hợp lệ trên Firebase nhưng chưa có trong DB
   - Tự động tạo profile mặc định thay vì raise `NotFoundError`
   - Cần implement Firebase Admin SDK validation

2. **Track owner contributions:**
   - Có thể thêm field `owner_contributed_count` trên main collection document
   - Hoặc tạo một cách khác để theo dõi số lượng places owner đã thêm

3. **Optimize collaborator checks:**
   - Cache collaborator list để giảm số lần query sub-collection
   - Sử dụng Redis hoặc in-memory cache
