import Icon from '@/components/ui/Icon';
import { fmtPrice, fmtDate } from '@/utils/format';
import { calculateDuration } from '@/services/profile/stays.service';

/**
 * StayCard Component
 * Display individual stay/booking information
 * 
 * @param {Object} props
 * @param {Object} props.stay - Stay object
 * @param {string} props.variant - Card variant ('expanded' | 'compact')
 * @param {Function} props.onViewDetails - View details callback
 */
const StayCard = ({ stay, variant = 'expanded', onViewDetails }) => {
  const duration = calculateDuration(stay.checkIn, stay.checkOut);
  
  const getStatusBadge = (status) => {
    const badges = {
      upcoming: {
        label: 'Upcoming',
        className: 'bg-primary/10 text-primary',
        icon: 'schedule',
      },
      completed: {
        label: 'Completed',
        className: 'bg-green-100 text-green-700',
        icon: 'check_circle',
      },
      cancelled: {
        label: 'Cancelled',
        className: 'bg-red-100 text-red-700',
        icon: 'cancel',
      },
      ongoing: {
        label: 'Ongoing',
        className: 'bg-blue-100 text-blue-700',
        icon: 'hotel',
      },
    };
    
    return badges[status] || badges.upcoming;
  };

  const statusBadge = getStatusBadge(stay.status);

  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-xl border border-outline-variant/20 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
           onClick={() => onViewDetails(stay)}>
        <div className="flex gap-4 p-4">
          {/* Hotel Image */}
          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
            <img
              src={stay.image || '/placeholder.png'}
              alt={stay.hotelName}
              className="w-full h-full object-cover"
            />
            <div className={`absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${statusBadge.className}`}>
              <Icon name={statusBadge.icon} size={12} variant="filled" />
              {statusBadge.label}
            </div>
          </div>

          {/* Stay Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-on-surface mb-1 truncate">
              {stay.hotelName}
            </h3>
            
            <div className="flex items-center gap-1 text-on-surface-variant mb-2">
              <Icon name="location_on" size={14} />
              <span className="text-sm truncate">{stay.location}</span>
            </div>

            <div className="flex items-center gap-4 text-sm text-on-surface-variant">
              <div className="flex items-center gap-1">
                <Icon name="calendar_today" size={14} />
                <span>{fmtDate(stay.checkIn)}</span>
              </div>
              <span>•</span>
              <span>{duration} {duration === 1 ? 'night' : 'nights'}</span>
            </div>
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-lg text-primary">
              {fmtPrice(stay.price, stay.currency)}
            </p>
            {stay.rating && (
              <div className="flex items-center gap-1 justify-end mt-1">
                <Icon name="star" size={14} className="text-yellow-500" variant="filled" />
                <span className="text-sm font-semibold">{stay.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Expanded variant
  return (
    <div className="bg-white rounded-2xl border border-outline-variant/20 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Hotel Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={stay.image || '/placeholder.png'}
          alt={stay.hotelName}
          className="w-full h-full object-cover"
        />
        <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 ${statusBadge.className}`}>
          <Icon name={statusBadge.icon} size={16} variant="filled" />
          {statusBadge.label}
        </div>
      </div>

      {/* Stay Details */}
      <div className="p-6">
        {/* Hotel Name and Location */}
        <div className="mb-4">
          <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
            {stay.hotelName}
          </h3>
          
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <Icon name="location_on" size={18} />
            <span className="text-sm">{stay.location}</span>
          </div>

          {stay.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Icon name="star" size={18} className="text-yellow-500" variant="filled" />
                <span className="font-semibold text-sm">{stay.rating.toFixed(1)}</span>
              </div>
              {stay.review && (
                <span className="text-sm text-on-surface-variant">• {stay.review}</span>
              )}
            </div>
          )}
        </div>

        {/* Dates and Duration */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-surface-container-low/50 rounded-xl">
          <div>
            <div className="flex items-center gap-2 text-on-surface-variant mb-1">
              <Icon name="login" size={16} />
              <span className="text-xs font-semibold uppercase">Check-in</span>
            </div>
            <p className="font-semibold text-sm text-on-surface">{fmtDate(stay.checkIn)}</p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 text-on-surface-variant mb-1">
              <Icon name="logout" size={16} />
              <span className="text-xs font-semibold uppercase">Check-out</span>
            </div>
            <p className="font-semibold text-sm text-on-surface">{fmtDate(stay.checkOut)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 p-3 bg-primary/5 rounded-lg">
          <div className="flex items-center gap-2">
            <Icon name="nights_stay" size={18} className="text-primary" />
            <span className="text-sm font-semibold text-on-surface">
              {duration} {duration === 1 ? 'Night' : 'Nights'}
            </span>
          </div>
          
          {stay.confirmation && (
            <div className="flex items-center gap-2">
              <Icon name="confirmation_number" size={18} className="text-on-surface-variant" />
              <span className="text-sm font-mono text-on-surface-variant">
                {stay.confirmation}
              </span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-on-surface-variant">Total Price:</span>
            <span className="font-bold text-2xl text-primary">
              {fmtPrice(stay.price, stay.currency)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onViewDetails(stay)}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-primary-container transition-colors"
          >
            <Icon name="visibility" size={18} />
            View Details
          </button>
          
          <button
            className="flex items-center justify-center gap-2 bg-surface-container-low text-on-surface px-4 py-3 rounded-xl font-semibold text-sm hover:bg-surface-container transition-colors"
          >
            <Icon name="download" size={18} />
            Receipt
          </button>
          
          <button
            className="flex items-center justify-center gap-2 bg-surface-container-low text-on-surface px-4 py-3 rounded-xl font-semibold text-sm hover:bg-surface-container transition-colors"
          >
            <Icon name="chat" size={18} />
            Contact
          </button>
        </div>
      </div>
    </div>
  );
};

export default StayCard;
