const Icon = ({ name, className = "", size = 24 }) => {
  return (
    <span 
      className={`material-symbols-outlined ${className}`} 
      style={{ fontSize: size }}
    >
      {name}
    </span>
  );
};
export default Icon;