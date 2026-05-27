import Icon from "@/components/ui/Icon";

function Footer() {
  const links = ["About", "Privacy", "Terms", "Support"];

  return (
    <footer className="flex-none border-t border-outline-variant/20 bg-surface-container-low">
      <div className="flex flex-col md:flex-row items-center justify-between px-10 py-2 gap-2 max-w-screen-2xl mx-auto">
        <span className="font-headline font-extrabold text-primary">Lodgy4U</span>
        <div className="flex gap-6">
        </div>
        <p className="text-[10px] text-outline">© 2024 Lodgy4U. Editorial Excellence in Travel.</p>
      </div>
    </footer>
  );
}

export default Footer;
