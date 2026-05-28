import Icon from "@/components/ui/Icon";

function Footer() {
  const links = ["Giới thiệu", "Quyền riêng tư", "Điều khoản", "Hỗ trợ"];

  return (
    <footer className="flex-none border-t border-outline-variant/20 bg-surface-container-low">
      <div className="flex flex-col md:flex-row items-center justify-between px-10 py-2 gap-2 max-w-screen-2xl mx-auto">
        <span className="font-headline font-extrabold text-primary text-[20px]">Lodgy4U</span>
        <div className="flex gap-6">
        </div>
        <p className="text-[12px] text-outline">© 2024 Lodgy4U. Chất lượng du lịch đỉnh cao.</p>
      </div>
    </footer>
  );
}

export default Footer;
