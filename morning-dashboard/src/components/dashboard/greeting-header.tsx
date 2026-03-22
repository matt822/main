"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function GreetingHeader({ userName }: { userName: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="text-center py-8">
      <h1 className="text-5xl lg:text-6xl font-bold gradient-text mb-2">
        {getGreeting()}, {userName}
      </h1>
      <p className="text-xl text-sand/70">
        {format(time, "EEEE, MMMM d, yyyy")}
      </p>
      <p className="text-3xl font-light text-sand/50 mt-1 font-mono">
        {format(time, "h:mm:ss a")}
      </p>
    </header>
  );
}
