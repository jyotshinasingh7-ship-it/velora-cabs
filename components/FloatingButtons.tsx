export default function FloatingButtons() {
  return (
    <>
      <a
        href="https://wa.me/919997997390"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-6 z-50 bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition hover:scale-110"
      >
        💬
      </a>

      <a
        href="tel:+919997997390"
        className="fixed bottom-6 right-6 z-50 bg-cyan-500 hover:bg-cyan-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition hover:scale-110"
      >
        📞
      </a>
    </>
  );
}