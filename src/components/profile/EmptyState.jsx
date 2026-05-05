import Icon from '@/components/ui/Icon';

/**
 * EmptyState Component
 * Display empty state messages with call-to-action
 * 
 * @param {Object} props
 * @param {string} props.icon - Icon name
 * @param {string} props.title - Title text
 * @param {string} props.description - Description text
 * @param {string} props.actionLabel - Action button label (optional)
 * @param {Function} props.onAction - Action button click handler (optional)
 */
const EmptyState = ({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center mb-6">
        <Icon name={icon} size={40} className="text-on-surface-variant" />
      </div>

      {/* Title */}
      <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-base text-on-surface-variant max-w-md mb-6">
        {description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary-container transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
