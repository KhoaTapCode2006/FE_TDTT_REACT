// Không chứa logic đăng nhập, chỉ nhận props và hiển thị
export const Input = ({ label, type = "text", ...props }) => (
  <div className="flex flex-col gap-1 mb-4">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <input 
      type={type} 
      className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
      {...props} 
    />
  </div>
);