import React, { ReactNode, useRef } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import './BottomSheet.css';

type SnapPoint = number | string; // e.g., 0.3 (30%) or "300px"

interface BottomSheetProps {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
    snapPoints?: SnapPoint[];
}

const BottomSheet: React.FC<BottomSheetProps> = ({ children, isOpen, onClose, snapPoints = ['85%'] }) => {
    const controls = useAnimation();
    const sheetRef = useRef<HTMLDivElement>(null);

    const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const sheetHeight = sheetRef.current?.clientHeight || window.innerHeight;
        const dragThreshold = sheetHeight * 0.2;

        if (info.offset.y > dragThreshold) {
            onClose();
        } else {
            // Snap back to the top
            await controls.start({y: 0});
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <>
            <motion.div
                className="bottom-sheet-backdrop"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            />
            <motion.div
                ref={sheetRef}
                className="bottom-sheet-container"
                style={{ height: typeof snapPoints[0] === 'string' ? snapPoints[0] : `${snapPoints[0] * 100}%` }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 40, stiffness: 400 }}
            >
                <div className="bottom-sheet-handle" />
                <div className="bottom-sheet-content">
                    {children}
                </div>
            </motion.div>
        </>
    );
};

export default BottomSheet;