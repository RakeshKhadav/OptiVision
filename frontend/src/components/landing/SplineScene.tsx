"use client";

import Spline from '@splinetool/react-spline';
import { useState } from 'react';

export default function SplineScene() {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className="w-full h-full relative">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-base-950 z-10 transition-opacity duration-700">
                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin opacity-50" />
                </div>
            )}
            <Spline
                scene="https://prod.spline.design/5KhzU6eCf7iXx94B/scene.splinecode"
                onLoad={() => setIsLoading(false)}
                className="w-full h-full"
            />
        </div>
    );
}
