function Icon({ name, filled = false, size = 22, className = "" }) {
  return (
    <span
      className={`ms ${filled ? "ms-filled" : ""} ${className}`}
      style={{ fontSize: size }}
    >
      {name}
    </span>
  );
}

export default Icon;
