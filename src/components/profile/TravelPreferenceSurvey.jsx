import { useState, useEffect } from 'react';
import { travelPreferenceService } from '@/services/profile/travelPreference.service';
import Icon from '@/components/ui/Icon';

/**
 * TravelPreferenceSurvey Component
 * Modal survey for collecting user travel preferences
 * Based on the demo UI in demoUI/demoscript.js
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether survey modal is open
 * @param {Function} props.onClose - Callback when survey is closed
 * @param {Function} props.onComplete - Callback after survey is completed and submitted
 */
const TravelPreferenceSurvey = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    weather_tolerance: '',
    preferred_amenities: [],
    must_have_amenities: [],
    excluded_amenities: [],
    preferred_location_tags: [],
    disliked_location_tags: [],
    notes: ''
  });

  const quizData = [
    {
      field: 'weather_tolerance',
      question: 'Bạn chịu đựng thời tiết xấu như thế nào?',
      type: 'single',
      icon: 'cloud',
      options: ['Thấp', 'Trung bình', 'Cao']
    },
    {
      field: 'preferred_amenities',
      question: 'Bạn ưu tiên tiện nghi nào? (Chọn nhiều)',
      type: 'multi',
      icon: 'star',
      options: ['WiFi', 'Bữa sáng', 'Hồ bơi', 'Spa', 'Phòng gym', 'Bãi đậu xe', 'Cho phép thú cưng']
    },
    {
      field: 'must_have_amenities',
      question: 'Bạn bắt buộc phải có tiện nghi nào? (Nếu có)',
      type: 'multi',
      icon: 'check_circle',
      options: ['WiFi', 'Bữa sáng', 'Hồ bơi', 'Spa', 'Phòng gym', 'Bãi đậu xe', 'Cho phép thú cưng']
    },
    {
      field: 'excluded_amenities',
      question: 'Bạn muốn tránh tiện nghi nào? (Nếu có)',
      type: 'multi',
      icon: 'cancel',
      options: ['WiFi', 'Bữa sáng', 'Hồ bơi', 'Spa', 'Phòng gym', 'Bãi đậu xe', 'Cho phép thú cưng']
    },
    {
      field: 'preferred_location_tags',
      question: 'Bạn thích khu vực nào? (Chọn nhiều)',
      type: 'multi',
      icon: 'location_on',
      options: ['Gần trung tâm thành phố', 'Gần bãi biển', 'Gần núi', 'Khu yên tĩnh', 'Gần phương tiện công cộng']
    },
    {
      field: 'disliked_location_tags',
      question: 'Khu vực bạn không thích? (Nếu có)',
      type: 'multi',
      icon: 'not_interested',
      options: ['Gần trung tâm thành phố', 'Gần bãi biển', 'Gần núi', 'Khu yên tĩnh', 'Gần phương tiện công cộng']
    }
  ];

  const totalSteps = quizData.length + 3; // intro + quiz questions + notes + outro
  const notesStepIdx = quizData.length + 1;
  const outroStepIdx = quizData.length + 2;

  const getWeatherValue = (label) => {
    const map = { 'Thấp': 'thap', 'Trung bình': 'trung_binh', 'Cao': 'cao' };
    return map[label] || label;
  };

  const handleOptionSelect = (field, value, isMulti) => {
    setFormData(prev => {
      if (isMulti) {
        const current = prev[field] || [];
        const isSelected = current.includes(value);
        return {
          ...prev,
          [field]: isSelected
            ? current.filter(v => v !== value)
            : [...current, value]
        };
      } else {
        // For single select (weather_tolerance), convert label to value
        const finalValue = field === 'weather_tolerance' ? getWeatherValue(value) : value;
        return { ...prev, [field]: finalValue };
      }
    });
  };

  const handleNotesChange = (text) => {
    setFormData(prev => ({ ...prev, notes: text }));
  };

  const getOptionDisabled = (field, option) => {
    if (field === 'excluded_amenities') {
      return (
        formData.preferred_amenities.includes(option) ||
        formData.must_have_amenities.includes(option)
      );
    }

    if (field === 'disliked_location_tags') {
      return formData.preferred_location_tags.includes(option);
    }

    return false;
  };

  useEffect(() => {
    const blockedAmenities = new Set([
      ...formData.preferred_amenities,
      ...formData.must_have_amenities
    ]);
    const filteredExcluded = (formData.excluded_amenities || []).filter(
      (option) => !blockedAmenities.has(option)
    );

    if (filteredExcluded.length !== formData.excluded_amenities.length) {
      setFormData((prev) => ({ ...prev, excluded_amenities: filteredExcluded }));
    }
  }, [formData.preferred_amenities, formData.must_have_amenities, formData.excluded_amenities]);

  useEffect(() => {
    const filteredDisliked = (formData.disliked_location_tags || []).filter(
      (option) => !formData.preferred_location_tags.includes(option)
    );

    if (filteredDisliked.length !== formData.disliked_location_tags.length) {
      setFormData((prev) => ({ ...prev, disliked_location_tags: filteredDisliked }));
    }
  }, [formData.preferred_location_tags, formData.disliked_location_tags]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Submit preferences to backend
      await travelPreferenceService.savePreferences(formData);
      
      // Move to outro step
      setCurrentStep(outroStepIdx);
      
      // Call completion callback after a short delay
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 2000);
    } catch (err) {
      console.error('Error submitting survey:', err);
      setError(err.message || 'Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < notesStepIdx) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setFormData({
      weather_tolerance: '',
      preferred_amenities: [],
      must_have_amenities: [],
      excluded_amenities: [],
      preferred_location_tags: [],
      disliked_location_tags: [],
      notes: ''
    });
    setError(null);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999998] flex items-center justify-center p-4">
      {/* Survey Container */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-outline-variant">
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4 flex justify-between items-center border-b">
          <div className="flex items-center gap-3">
            <Icon name="flight_takeoff" size={24} />
            <h2 className="font-headline font-bold text-xl">Khảo sát sở thích</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full font-medium">
              {currentStep === 0
                ? 'Giới thiệu'
                : currentStep === outroStepIdx
                ? 'Hoàn tất'
                : currentStep === notesStepIdx
                ? 'Ghi chú thêm'
                : `Câu ${currentStep}/${quizData.length}`}
            </span>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              aria-label="Close"
            >
              <Icon name="close" size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Intro Step */}
          {currentStep === 0 && (
            <div className="text-center space-y-6 py-8">
              <div className="text-6xl mb-4">🌍</div>
              <h3 className="font-headline font-bold text-2xl text-on-surface">
                Thiết kế chuyến đi của riêng bạn
              </h3>
              <p className="text-on-surface-variant text-lg max-w-md mx-auto">
                Để giúp chúng tôi mang đến trải nghiệm lưu trú và lịch trình cá nhân hóa hoàn hảo nhất, 
                hãy dành ra khoảng <strong>1-2 phút</strong> để chia sẻ một chút về thói quen và sở thích du lịch của bạn nhé!
              </p>
            </div>
          )}

          {/* Question Steps */}
          {currentStep > 0 && currentStep <= quizData.length && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Icon name={quizData[currentStep - 1].icon} size={28} className="text-primary" />
                <h3 className="font-headline font-bold text-xl text-on-surface">
                  {quizData[currentStep - 1].question}
                </h3>
              </div>

              {/* Options Grid */}
              <div className="flex flex-wrap gap-3">
                {quizData[currentStep - 1].options.map(option => {
                  const field = quizData[currentStep - 1].field;
                  const isMulti = quizData[currentStep - 1].type === 'multi';
                  const isSelected = isMulti
                    ? (formData[field] || []).includes(option)
                    : formData[field] === getWeatherValue(option);
                  const isDisabled = getOptionDisabled(field, option);

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => !isDisabled && handleOptionSelect(field, option, isMulti)}
                      disabled={isDisabled}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-white shadow-md'
                          : isDisabled
                          ? 'bg-surface-container border border-outline text-on-surface-variant opacity-50 cursor-not-allowed'
                          : 'bg-surface-container border border-outline hover:bg-surface-container-high'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes Step */}
          {currentStep === notesStepIdx && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Icon name="description" size={28} className="text-primary" />
                <h3 className="font-headline font-bold text-xl text-on-surface">
                  Ghi chú thêm
                </h3>
              </div>
              <textarea
                value={formData.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Nhập các yêu cầu đặc biệt của bạn (VD: dị ứng hải sản, thích phòng view biển, cần hỗ trợ xe lăn...)"
                className="w-full p-4 border border-outline rounded-lg min-h-[150px] text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Outro Step */}
          {currentStep === outroStepIdx && (
            <div className="text-center space-y-6 py-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="font-headline font-bold text-2xl text-on-surface">
                Hoàn tất khảo sát!
              </h3>
              <p className="text-on-surface-variant text-lg max-w-md mx-auto">
                Cảm ơn bạn đã dành thời gian chia sẻ. Chúng tôi sẽ phân tích các ưu tiên này 
                để đề xuất cho bạn những lựa chọn điểm đến tuyệt vời và phù hợp nhất.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-surface-container-low flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0 || currentStep === outroStepIdx}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              currentStep === 0 || currentStep === outroStepIdx
                ? 'text-on-surface-variant/50 cursor-not-allowed'
                : 'text-primary hover:bg-primary/10'
            }`}
          >
            <Icon name="arrow_back" size={20} />
            Quay lại
          </button>

          <div className="flex-1" />

          {currentStep < notesStepIdx && currentStep < outroStepIdx && (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium bg-primary text-white hover:bg-primary-dark transition-all"
            >
              Tiếp theo
              <Icon name="arrow_forward" size={20} />
            </button>
          )}

          {currentStep === notesStepIdx && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium bg-primary text-white hover:bg-primary-dark transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Icon name="hourglass_top" size={20} className="animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Icon name="send" size={20} />
                  Gửi thông tin
                </>
              )}
            </button>
          )}

          {currentStep === outroStepIdx && (
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium bg-primary text-white hover:bg-primary-dark transition-all"
            >
              <Icon name="close" size={20} />
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TravelPreferenceSurvey;
