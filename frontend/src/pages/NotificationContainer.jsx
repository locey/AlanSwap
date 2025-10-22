// 通知组件
const NotificationContainer = ({ notifications }) => (
    <div className="fixed top-20 right-5 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`px-4 py-3 rounded-lg font-medium text-white shadow-lg transform transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            notification.type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          }`}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );

export default NotificationContainer