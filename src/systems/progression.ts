import { getState } from '@/core/state';
import { bus, log } from '@/core/events';
import { saveGame } from '@/core/save';
import { xpToNext, getMaxHp, uniqueEffectValue } from './stats';
import { skillsForClass, MAX_SKILL_RANK, getSkill } from '@/data/skills';
import type { AttrId } from '@/core/types';

// Nivel a partir del cual se pueden mejorar los rangos de habilidad
export const SKILL_UPGRADE_LEVEL = 13;

export function gainXp(amount: number): void {
  const s = getState();
  const boosted = Math.round(amount * (1 + uniqueEffectValue('xpboost')));
  s.player.xp += boosted;

  let leveled = false;
  while (s.player.xp >= xpToNext(s.player.level)) {
    s.player.xp -= xpToNext(s.player.level);
    s.player.level += 1;
    s.player.attrPoints += 1;
    // los puntos de mejora de habilidad se ganan recién desde el nivel 13
    // (cuando ya se aprendieron las 4 habilidades)
    if (s.player.level >= SKILL_UPGRADE_LEVEL) s.player.skillPoints += 1;
    leveled = true;

    // Las habilidades se aprenden automáticamente (rango 1) al alcanzar su nivel
    for (const skill of skillsForClass(s.player.classId)) {
      if (s.player.level >= skill.unlockLevel && !(skill.id in s.player.skillRanks)) {
        s.player.skillRanks[skill.id] = 1;
        log(`${skill.emoji} ¡Nueva habilidad aprendida: ${skill.name}!`, 'level');
      }
    }
  }

  if (leveled) {
    // subir de nivel restaura un 30% de la vida máxima
    s.player.hp = Math.min(getMaxHp(), s.player.hp + Math.round(getMaxHp() * 0.3));
    const skillNote = s.player.level >= SKILL_UPGRADE_LEVEL ? ', +1 punto de habilidad' : '';
    log(`🎉 ¡Nivel ${s.player.level} alcanzado! +1 punto de atributo${skillNote}`, 'level');
    bus.emit('player:levelUp', { level: s.player.level });
  }
  saveGame();
  bus.emit('state:changed');
}

export function gainGold(amount: number): void {
  const s = getState();
  const boosted = Math.round(amount * (1 + uniqueEffectValue('goldfind')));
  s.player.gold += boosted;
  bus.emit('gold:gained', { amount: boosted });
  bus.emit('state:changed');
}

export function spendAttrPoint(attr: AttrId): boolean {
  const s = getState();
  if (s.player.attrPoints <= 0) return false;
  s.player.attrPoints -= 1;
  s.player.attributes[attr] += 1;
  // la constitución sube la vida máxima: conservar el % de vida actual
  s.player.hp = Math.min(s.player.hp, getMaxHp());
  saveGame();
  bus.emit('state:changed');
  return true;
}

export function upgradeSkill(skillId: string): boolean {
  const s = getState();
  if (s.player.level < SKILL_UPGRADE_LEVEL) return false;
  const rank = s.player.skillRanks[skillId] ?? 0;
  if (rank === 0 || rank >= MAX_SKILL_RANK || s.player.skillPoints <= 0) return false;
  s.player.skillPoints -= 1;
  s.player.skillRanks[skillId] = rank + 1;
  const skill = getSkill(skillId);
  log(`${skill.emoji} ${skill.name} mejorada a rango ${rank + 1}`, 'level');
  saveGame();
  bus.emit('state:changed');
  return true;
}
