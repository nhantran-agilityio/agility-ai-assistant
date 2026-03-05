const ChatIcon = () => (
    <svg
        viewBox="0 0 24 24"
        className="w-16 h-16 text-white"
        fill="currentColor"
    >
        {/* Bubble */}
        <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 5v-5H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />

        {/* Dots */}
        <circle cx="9" cy="11" r="1.2" fill="black" />
        <circle cx="12" cy="11" r="1.2" fill="black" />
        <circle cx="15" cy="11" r="1.2" fill="black" />
    </svg>
);

export default ChatIcon;
