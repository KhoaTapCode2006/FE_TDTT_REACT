import { useState } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * InviteContributors Component
 * 
 * A modern component for inviting users to contribute to a collection
 * and managing pending invitations
 * 
 * @param {Object} props
 * @param {string} props.collectionId - The ID of the collection
 * @param {Function} props.onInviteSent - Callback when invitation is sent successfully
 * @param {Function} props.onInviteRevoked - Callback when invitation is revoked
 */
export default function InviteContributors({ 
  collectionId, 
  onInviteSent, 
  onInviteRevoked 
}) {
  const [inviteUid, setInviteUid] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dummy pending invitations data
  const [pendingInvitations, setPendingInvitations] = useState([
    {
      id: 'CyihlbAK7iS4V8tLWtPmA',
      target_uid: 'ysS4V8tLWtPmAK7iS4V8t',
      status: 'pending',
      expired_at: '2026-05-26T16:09:56.092414Z',
      created_at: '2026-05-20T16:09:56.092414Z'
    },
    {
      id: 'DzjimcBL8jT5W9uMXuQnB',
      target_uid: 'ztT5W9uMXuQnBL8jT5W9u',
      status: 'pending',
      expired_at: '2026-05-27T10:30:00.000000Z',
      created_at: '2026-05-21T10:30:00.000000Z'
    },
    {
      id: 'EaknodCM9kU6X0vNYvRoC',
      target_uid: 'auU6X0vNYvRoCM9kU6X0v',
      status: 'pending',
      expired_at: '2026-05-25T14:45:30.123456Z',
      created_at: '2026-05-19T14:45:30.123456Z'
    }
  ]);

  /**
   * Handle sending invitation
   * 
   * TODO: Implement API call
   * - Validate inviteUid is not empty
   * - Call API: POST /collections/{collectionId}/invitations
   *   Body: { target_uid: inviteUid }
   * - On success: Add new invitation to pendingInvitations state
   * - Clear input field
   * - Show success toast
   * - Call onInviteSent callback
   */
  const handleSendInvite = async () => {
    if (!inviteUid.trim()) {
      alert('Vui lòng nhập UID người dùng');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: Replace with actual API call
      // const response = await invitationService.sendInvitation(collectionId, inviteUid);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Sending invitation to:', inviteUid);
      
      // TODO: Add new invitation to state from API response
      // setPendingInvitations(prev => [...prev, response.data]);
      
      setInviteUid('');
      alert('Lời mời đã được gửi thành công!');
      onInviteSent?.();
    } catch (error) {
      console.error('Failed to send invitation:', error);
      alert('Không thể gửi lời mời. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle revoking invitation
   * 
   * TODO: Implement API call
   * - Call API: DELETE /collections/{collectionId}/invitations/{invitationId}
   * - On success: Remove invitation from pendingInvitations state
   * - Show success toast
   * - Call onInviteRevoked callback
   * 
   * @param {string} invitationId - The ID of the invitation to revoke
   */
  const handleRevokeInvite = async (invitationId) => {
    if (!window.confirm('Bạn có chắc muốn thu hồi lời mời này?')) {
      return;
    }

    try {
      // TODO: Replace with actual API call
      // await invitationService.revokeInvitation(collectionId, invitationId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Revoking invitation:', invitationId);
      
      // Remove from state
      setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      alert('Lời mời đã được thu hồi');
      onInviteRevoked?.(invitationId);
    } catch (error) {
      console.error('Failed to revoke invitation:', error);
      alert('Không thể thu hồi lời mời. Vui lòng thử lại.');
    }
  };

  /**
   * Format expiration date
   */
  const formatExpirationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = date - now;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMs < 0) {
      return 'Đã hết hạn';
    } else if (diffInHours < 24) {
      return `Hết hạn sau ${diffInHours} giờ`;
    } else {
      return `Hết hạn sau ${diffInDays} ngày`;
    }
  };

  /**
   * Check if invitation is expired
   */
  const isExpired = (dateString) => {
    return new Date(dateString) < new Date();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Mời người đóng góp
        </h3>
        <p className="text-sm text-gray-500">
          Gửi lời mời cho người dùng để họ có thể đóng góp vào bộ sưu tập này
        </p>
      </div>

      {/* Invite Form */}
      <div className="mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            value={inviteUid}
            onChange={(e) => setInviteUid(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isSubmitting) {
                handleSendInvite();
              }
            }}
            placeholder="Nhập UID người dùng để mời..."
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendInvite}
            disabled={isSubmitting || !inviteUid.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Đang gửi...</span>
              </>
            ) : (
              <>
                <Icon name="send" size={18} />
                <span>Gửi lời mời</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pending Invitations Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-900">
            Lời mời đang chờ
          </h4>
          {pendingInvitations.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {pendingInvitations.length}
            </span>
          )}
        </div>

        {/* Invitations List */}
        {pendingInvitations.length === 0 ? (
          <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
            <Icon name="mail_outline" size={40} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Chưa có lời mời nào đang chờ</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  isExpired(invitation.expired_at)
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                {/* Left: Invitation Info */}
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon 
                      name="person_outline" 
                      size={16} 
                      className={isExpired(invitation.expired_at) ? 'text-red-600' : 'text-gray-600'} 
                    />
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {invitation.target_uid}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon 
                      name="schedule" 
                      size={14} 
                      className={isExpired(invitation.expired_at) ? 'text-red-500' : 'text-gray-400'} 
                    />
                    <p className={`text-xs ${
                      isExpired(invitation.expired_at) 
                        ? 'text-red-600 font-medium' 
                        : 'text-gray-500'
                    }`}>
                      {formatExpirationDate(invitation.expired_at)}
                    </p>
                  </div>
                </div>

                {/* Right: Revoke Button */}
                <button
                  onClick={() => handleRevokeInvite(invitation.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-medium text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <Icon name="close" size={16} />
                  <span>Thu hồi</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <Icon name="info" size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">
              Lưu ý về lời mời
            </p>
            <p className="text-xs text-blue-700 leading-relaxed">
              Lời mời sẽ tự động hết hạn sau 7 ngày. Người được mời cần chấp nhận lời mời trước khi hết hạn để trở thành người đóng góp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
