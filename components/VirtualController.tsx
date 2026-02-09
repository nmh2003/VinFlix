
import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import nipplejs from 'nipplejs';
import { X, Settings2 } from 'lucide-react';

interface VirtualControllerProps {
  onClose: () => void;
}

// Key mapping configuration
const KEY_MAP = {
  UP: { code: 'ArrowUp', key: 'ArrowUp', keyCode: 38 },
  DOWN: { code: 'ArrowDown', key: 'ArrowDown', keyCode: 40 },
  LEFT: { code: 'ArrowLeft', key: 'ArrowLeft', keyCode: 37 },
  RIGHT: { code: 'ArrowRight', key: 'ArrowRight', keyCode: 39 },
  W: { code: 'KeyW', key: 'w', keyCode: 87 },
  S: { code: 'KeyS', key: 's', keyCode: 83 },
  A: { code: 'KeyA', key: 'a', keyCode: 65 },
  D: { code: 'KeyD', key: 'd', keyCode: 68 },
  SPACE: { code: 'Space', key: ' ', keyCode: 32 },
  ENTER: { code: 'Enter', key: 'Enter', keyCode: 13 },
  ESC: { code: 'Escape', key: 'Escape', keyCode: 27 },
};

export const VirtualController: React.FC<VirtualControllerProps> = ({ onClose }) => {
  const joystickZoneRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<any>(null);
  const activeKeys = useRef<Set<string>>(new Set());
  
  // Mapping mode: Arrow keys or WASD
  const [useWasd, setUseWasd] = useState(true);

  // Helper to dispatch key events
  const simulateKey = (type: 'keydown' | 'keyup', keyConfig: any) => {
    if (!keyConfig) return;
    
    // We try to dispatch to both document and window to maximize compatibility
    const event = new KeyboardEvent(type, {
      key: keyConfig.key,
      code: keyConfig.code,
      keyCode: keyConfig.keyCode,
      which: keyConfig.keyCode,
      bubbles: true,
      cancelable: true,
      view: window
    });

    document.dispatchEvent(event);
    if (document.activeElement) {
        document.activeElement.dispatchEvent(event);
    }
  };

  const pressKey = (keyConfig: any) => {
    if (activeKeys.current.has(keyConfig.code)) return; // Prevent spamming
    activeKeys.current.add(keyConfig.code);
    simulateKey('keydown', keyConfig);
  };

  const releaseKey = (keyConfig: any) => {
    if (!activeKeys.current.has(keyConfig.code)) return;
    activeKeys.current.delete(keyConfig.code);
    simulateKey('keyup', keyConfig);
  };

  const releaseAllKeys = () => {
    activeKeys.current.forEach(code => {
       // Reverse lookup config (simplified)
       const conf = Object.values(KEY_MAP).find(c => c.code === code);
       if (conf) simulateKey('keyup', conf);
    });
    activeKeys.current.clear();
  };

  // Joystick Initialization
  useEffect(() => {
    if (!joystickZoneRef.current) return;

    managerRef.current = nipplejs.create({
      zone: joystickZoneRef.current,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      color: 'white',
      size: 100,
      restOpacity: 0.5,
      threshold: 0.2 // Sensitivity
    });

    let currentDirection: string | null = null;

    managerRef.current.on('move', (evt: any, data: any) => {
      if (data.direction) {
        const dir = data.direction.angle; // up, down, left, right
        
        // If direction changed, release previous keys
        if (currentDirection !== dir) {
            releaseAllKeys(); 
            currentDirection = dir;
        }

        // Press new keys based on direction
        if (dir === 'up') pressKey(useWasd ? KEY_MAP.W : KEY_MAP.UP);
        if (dir === 'down') pressKey(useWasd ? KEY_MAP.S : KEY_MAP.DOWN);
        if (dir === 'left') pressKey(useWasd ? KEY_MAP.A : KEY_MAP.LEFT);
        if (dir === 'right') pressKey(useWasd ? KEY_MAP.D : KEY_MAP.RIGHT);
      }
    });

    managerRef.current.on('end', () => {
      releaseAllKeys();
      currentDirection = null;
    });

    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
      }
      releaseAllKeys();
    };
  }, [useWasd]);

  // Handle Button Touch
  const handleBtnTouchStart = (e: React.TouchEvent | React.MouseEvent, keyConfig: any) => {
    e.preventDefault(); // Prevent scrolling/zooming
    pressKey(keyConfig);
  };

  const handleBtnTouchEnd = (e: React.TouchEvent | React.MouseEvent, keyConfig: any) => {
    e.preventDefault();
    releaseKey(keyConfig);
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none select-none">
      {/* Top Bar for Settings/Close */}
      <div className="absolute top-0 left-0 right-0 p-2 flex justify-between pointer-events-auto bg-gradient-to-b from-black/50 to-transparent">
         <button 
            onClick={() => setUseWasd(!useWasd)} 
            className="px-3 py-1 bg-black/40 text-white rounded-full text-xs backdrop-blur-md border border-white/20 flex items-center gap-1"
         >
            <Settings2 size={12} /> {useWasd ? 'WASD Mode' : 'Arrow Mode'}
         </button>
         <button 
            onClick={onClose} 
            className="p-2 bg-red-600/80 text-white rounded-full backdrop-blur-md shadow-lg"
         >
            <X size={20} />
         </button>
      </div>

      {/* Left Zone: Joystick */}
      <div className="absolute bottom-8 left-8 w-40 h-40 pointer-events-auto" ref={joystickZoneRef}>
         {/* NippleJS mounts here */}
      </div>

      {/* Right Zone: Action Buttons (Diamond Layout) */}
      <div className="absolute bottom-12 right-12 w-40 h-40 pointer-events-auto">
         <div className="relative w-full h-full">
            {/* Button Y (Top) */}
            <button
                className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-blue-500/60 active:bg-blue-500/90 text-white font-bold text-xl border-2 border-white/30 backdrop-blur-sm shadow-lg active:scale-95 transition-transform"
                onTouchStart={(e) => handleBtnTouchStart(e, KEY_MAP.W)} // Y often maps to secondary action or up
                onTouchEnd={(e) => handleBtnTouchEnd(e, KEY_MAP.W)}
                onMouseDown={(e) => handleBtnTouchStart(e, KEY_MAP.W)}
                onMouseUp={(e) => handleBtnTouchEnd(e, KEY_MAP.W)}
            >
                Y
            </button>

            {/* Button B (Right) */}
            <button
                className="absolute top-1/2 right-0 -translate-y-1/2 w-14 h-14 rounded-full bg-red-500/60 active:bg-red-500/90 text-white font-bold text-xl border-2 border-white/30 backdrop-blur-sm shadow-lg active:scale-95 transition-transform"
                onTouchStart={(e) => handleBtnTouchStart(e, KEY_MAP.ESC)} // B often Back/Esc
                onTouchEnd={(e) => handleBtnTouchEnd(e, KEY_MAP.ESC)}
                onMouseDown={(e) => handleBtnTouchStart(e, KEY_MAP.ESC)}
                onMouseUp={(e) => handleBtnTouchEnd(e, KEY_MAP.ESC)}
            >
                B
            </button>

            {/* Button A (Bottom) */}
            <button
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-green-500/60 active:bg-green-500/90 text-white font-bold text-xl border-2 border-white/30 backdrop-blur-sm shadow-lg active:scale-95 transition-transform"
                onTouchStart={(e) => handleBtnTouchStart(e, KEY_MAP.SPACE)} // A usually Jump/Select
                onTouchEnd={(e) => handleBtnTouchEnd(e, KEY_MAP.SPACE)}
                onMouseDown={(e) => handleBtnTouchStart(e, KEY_MAP.SPACE)}
                onMouseUp={(e) => handleBtnTouchEnd(e, KEY_MAP.SPACE)}
            >
                A
            </button>

            {/* Button X (Left) */}
            <button
                className="absolute top-1/2 left-0 -translate-y-1/2 w-14 h-14 rounded-full bg-yellow-500/60 active:bg-yellow-500/90 text-white font-bold text-xl border-2 border-white/30 backdrop-blur-sm shadow-lg active:scale-95 transition-transform"
                onTouchStart={(e) => handleBtnTouchStart(e, KEY_MAP.ENTER)} // X usually Attack/Enter
                onTouchEnd={(e) => handleBtnTouchEnd(e, KEY_MAP.ENTER)}
                onMouseDown={(e) => handleBtnTouchStart(e, KEY_MAP.ENTER)}
                onMouseUp={(e) => handleBtnTouchEnd(e, KEY_MAP.ENTER)}
            >
                X
            </button>
         </div>
      </div>
    </div>
  );
};
