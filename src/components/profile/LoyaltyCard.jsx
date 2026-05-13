import Icon from '@/components/ui/Icon';

/**
 * LoyaltyCard Component
 * Display user loyalty program status and progress
 * 
 * @param {Object} props
 * @param {Object} props.user - User object
 * @param {number} props.staysCount - Number of completed stays
 */
const LoyaltyCard = ({ user, staysCount = 0 }) => {
  // Tier thresholds
  const tiers = [
    { name: 'Bronze', min: 0, max: 4, color: 'from-amber-700 to-amber-900', icon: 'workspace_premium' },
    { name: 'Silver', min: 5, max: 9, color: 'from-gray-400 to-gray-600', icon: 'workspace_premium' },
    { name: 'Gold', min: 10, max: 19, color: 'from-yellow-400 to-yellow-600', icon: 'workspace_premium' },
    { name: 'Platinum', min: 20, max: Infinity, color: 'from-purple-400 to-purple-600', icon: 'diamond' },
  ];

  // Calculate current tier
  const getCurrentTier = (count) => {
    return tiers.find(tier => count >= tier.min && count <= tier.max) || tiers[0];
  };

  // Calculate next tier
  const getNextTier = (currentTier) => {
    const currentIndex = tiers.findIndex(t => t.name === currentTier.name);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  };

  const currentTier = getCurrentTier(staysCount);
  const nextTier = getNextTier(currentTier);

  // Calculate progress
  const calculateProgress = () => {
    if (!nextTier) return 100; // Max tier reached
    
    const staysInCurrentTier = staysCount - currentTier.min;
    const staysNeededForNextTier = nextTier.min - currentTier.min;
    const progress = (staysInCurrentTier / staysNeededForNextTier) * 100;
    
    return Math.min(Math.max(progress, 0), 100);
  };

  const progress = calculateProgress();
  const staysNeeded = nextTier ? nextTier.min - staysCount : 0;

  // Tier benefits
  const getTierBenefits = (tierName) => {
    const benefits = {
      Bronze: ['Basic rewards', 'Email support'],
      Silver: ['5% discount', 'Priority support', 'Free breakfast'],
      Gold: ['10% discount', '24/7 support', 'Free breakfast', 'Room upgrade'],
      Platinum: ['15% discount', 'Dedicated concierge', 'All Gold benefits', 'Exclusive access'],
    };
    return benefits[tierName] || [];
  };

  const nextTierBenefits = nextTier ? getTierBenefits(nextTier.name) : [];

  return (
    <div className={`relative bg-gradient-to-br ${currentTier.color} rounded-2xl overflow-hidden shadow-lg`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4zIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6TTEyIDM0YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00ek00OCAzNGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] bg-repeat"></div>
      </div>

      {/* Content */}
      <div className="relative p-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Icon name={currentTier.icon} size={28} className="text-white" variant="filled" />
            </div>
            <div>
              <p className="text-sm font-medium opacity-90">Membership Tier</p>
              <h3 className="font-headline font-bold text-2xl">{currentTier.name}</h3>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-medium opacity-90">Total Stays</p>
            <p className="font-bold text-3xl">{staysCount}</p>
          </div>
        </div>

        {/* Progress Section */}
        {nextTier ? (
          <>
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress to {nextTier.name}</span>
                <span className="text-sm font-bold">{Math.round(progress)}%</span>
              </div>
              
              <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Stays Needed */}
            <div className="flex items-center gap-2 mb-4 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Icon name="hotel" size={20} />
              <span className="text-sm font-medium">
                {staysNeeded === 1 
                  ? `Just 1 more stay to reach ${nextTier.name}!`
                  : `${staysNeeded} more stays to reach ${nextTier.name}`
                }
              </span>
            </div>

            {/* Next Tier Benefits */}
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Icon name="star" size={16} variant="filled" />
                {nextTier.name} Benefits:
              </p>
              <ul className="space-y-1">
                {nextTierBenefits.slice(0, 3).map((benefit, index) => (
                  <li key={index} className="text-sm flex items-center gap-2">
                    <Icon name="check_circle" size={14} variant="filled" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          // Max tier reached
          <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm text-center">
            <Icon name="emoji_events" size={32} className="mx-auto mb-2" variant="filled" />
            <p className="font-semibold">Congratulations!</p>
            <p className="text-sm opacity-90">You've reached the highest tier</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoyaltyCard;
