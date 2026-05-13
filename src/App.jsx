import FirebaseStatus from './components/dev/FirebaseStatus.jsx';

function App() {
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      <h1 className="text-4xl font-headline font-extrabold text-white shadow-editorial p-6 rounded-2xl bg-white/10 backdrop-blur-md">
        Booking4U - Tailwind đã chạy! 🚀
      </h1>
      
      {/* Firebase Status (Development Only) */}
      <FirebaseStatus />
    </div>
  )
}
export default App
