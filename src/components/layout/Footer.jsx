import Icon from "@/components/ui/Icon";

function Footer() {
  const links = ["About", "Privacy", "Terms", "Support"];

  return (
    <footer className="flex-none border-t border-outline-variant/20 bg-surface-container-low">
      <div className="flex flex-col md:flex-row items-center justify-between px-10 py-4 gap-3 max-w-screen-2xl mx-auto">
        <span className="font-headline font-extrabold text-primary">Booking4U</span>
        <div className="flex gap-6">
          {links.map((label) => (
            <a
              key={label}
              href="#"
              className="text-[11px] uppercase tracking-widest font-semibold text-on-surface-variant hover:text-secondary transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
        <p className="text-[10px] text-outline">© 2024 Booking4U. Editorial Excellence in Travel.</p>
      </div>
    </footer>
  );
}

export default Footer;
