import React, { useState, useEffect } from 'react';
import { NationBattle } from '../../types';

interface BattleInfoProps {
  battle: NationBattle;
  score: string | null;
}

const BattleInfo: React.FC<BattleInfoProps> = ({ battle, score }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [phase, setPhase] = useState('');

  let attackerIconUrl = '';
  if (battle.nation_icon) {
    const attackerCodeMatch = battle.nation_icon.match(/([A-Z]{2,})\.png$/);
    if (attackerCodeMatch && attackerCodeMatch[1]) {
      const attackerCode = attackerCodeMatch[1];
      // Construct the correct local path to your public/icons folder
      attackerIconUrl = `/icons/nation-${attackerCode}.png`;
    }
  }

  useEffect(() => {
    const getTargetTime = (): string | undefined => {
      if (battle.close_roll_call_at) {
        setPhase('徵召中');
        return battle.close_roll_call_at;
      }
      return undefined;
    };

    const targetTime = getTargetTime();
    if (!targetTime) return;

    const intervalId = setInterval(() => {
      const remaining = new Date(targetTime).getTime() - new Date().getTime();
      if (remaining <= 0) {
        setTimeLeft('00:00');
        clearInterval(intervalId);
      } else {
        const minutes = Math.floor((remaining / 1000 / 60) % 60);
        const seconds = Math.floor((remaining / 1000) % 60);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [battle]);

  if (!phase || !timeLeft) return null;

  return (
    <div className="battle-indicator">
      {attackerIconUrl && <img src={attackerIconUrl} alt="attacker" className="attacker-icon" />}
      <div className="battle-text">
        <span className="battle-phase">{phase} {timeLeft}</span>
        {score && <span className="battle-score">{score}</span>}
      </div>
    </div>
  );
};

export default BattleInfo;