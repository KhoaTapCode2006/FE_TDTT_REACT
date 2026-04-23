import { useApp } from "@/app/AppContext";
import HotelPopup from "./HotelPopup";
import Icon from "@/components/ui/Icon";
import { fmtPrice } from "@/utils/format";

function ClusterSplitView() {
  const { clusterHotels, activeHotel, setActiveHotel, setClusterHotels, setHoveredHotelId } = useApp();

  // Debug logging
  console.log('ClusterSplitView render - activeHotel:', activeHotel?.id, activeHotel?.name);

  if (!clusterHotels || clusterHotels.length === 0) return null;

  const handleClose = () => {
    setClusterHotels([]);
    setActiveHotel(null);
  };

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        // Close when clicking the backdrop
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="flex h-[80vh] w-[90vw] max-w-6xl rounded-2xl overflow-hidden shadow-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        {/* Left Sidebar - Hotel List */}
        <div className="w-96 h-full bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col">
          <div className="px-5 py-4 border-b border-outline-variant/20 bg-primary/5 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="font-headline text-lg font-bold text-primary">
                Hotels at this location
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                {clusterHotels.length} {clusterHotels.length === 1 ? 'hotel' : 'hotels'} found
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-surface-container transition-colors"
            >
              <Icon name="close" size={20} className="text-on-surface" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {clusterHotels.map((hotel) => (
              <button
                key={hotel.id}
                onMouseEnter={() => setHoveredHotelId(hotel.id)}
                onMouseLeave={() => setHoveredHotelId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Sidebar hotel clicked:', hotel.id, hotel.name);
                  setActiveHotel(hotel);
                }}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                  activeHotel?.id === hotel.id
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-outline-variant/30 bg-white hover:bg-surface-container hover:border-primary/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {hotel.images && hotel.images[0] && (
                    <img
                      src={hotel.images[0]}
                      alt={hotel.name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-sm mb-1 line-clamp-2 ${
                      activeHotel?.id === hotel.id ? 'text-primary' : 'text-on-surface'
                    }`}>
                      {hotel.name}
                    </h4>
                    <p className="text-xs text-on-surface-variant line-clamp-1 mb-1">
                      {hotel.address}
                    </p>
                    {hotel.ai_score && (
                      <p className="text-xs text-blue-600 font-semibold mb-1">
                        AI Score: {Number(hotel.ai_score).toFixed(1)}
                      </p>
                    )}
                    <p className="text-sm font-bold text-secondary">
                      {fmtPrice(hotel.pricePerNight)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side - Hotel Detail */}
        <div className="flex-1 h-full relative overflow-hidden bg-gray-50">
          {activeHotel ? (
            <div className="h-full overflow-y-auto">
              <HotelPopup key={activeHotel.id} hotel={activeHotel} onClose={handleClose} embedded={true} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-on-surface-variant">
              <div className="text-center">
                <Icon name="hotel" size={48} className="text-outline mb-3" />
                <p className="text-sm font-medium">Select a hotel to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClusterSplitView;
