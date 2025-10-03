
import React, { useState, useEffect } from 'react';
import type { NotificationMessage } from '../types.tsx';

interface NotificationProps {
    notification: NotificationMessage | null;
    onClear: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ notification, onClear }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (notification) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                // Allow time for fade out animation before clearing
                setTimeout(onClear, 400); 
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [notification, onClear]);

    if (!notification) return null;

    const baseClasses = "fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white text-lg flex items-center gap-3 z-50 transition-transform duration-400 ease-in-out";
    const colorClasses = notification.isError ? "bg-red-500" : "bg-green-500";
    const transformClasses = isVisible ? "translate-x-0" : "translate-x-[120%]";

    return (
        <div className={`${baseClasses} ${colorClasses} ${transformClasses}`}>
            <span>{notification.isError ? '❌' : '✅'}</span>
            <p>{notification.message}</p>
        </div>
    );
};