import React from 'react';
import { icons } from 'lucide-react';

const Icon = ({ name, size = 20, className = "" }) => {
    const LucideIcon = icons[name];

    // This check prevents the app from crashing if you provide an invalid icon name
    if (!LucideIcon) {
        console.error(`Icon ${name} not found in Lucide Icons!`);
        return null;
    }

    return <LucideIcon size={size} className={className} />;
};

export default Icon;