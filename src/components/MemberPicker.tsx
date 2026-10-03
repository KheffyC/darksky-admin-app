'use client';

import { useMemo, useState } from 'react';
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { CheckIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid';

export type PickerMember = { id: string; firstName: string; lastName: string; section: string | null };

const NO_SECTION = 'No section';

function tokens(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/[\s'-]+/)
    .filter((token) => token.length > 1);
}

/**
 * How likely a member is to be who this payment is for. The Stripe "member
 * name" field the payer typed counts most; the card's customer name (often a
 * parent sharing the last name) counts less.
 */
export function matchScore(member: PickerMember, memberName: string | null | undefined, customerName: string | null | undefined) {
  const first = tokens(member.firstName);
  const last = tokens(member.lastName);
  const typed = tokens(memberName);
  const payer = tokens(customerName);
  const has = (list: string[], names: string[]) => names.length > 0 && names.every((name) => list.includes(name));

  let score = 0;
  if (has(typed, first) && has(typed, last)) score = Math.max(score, 100);
  // Last name typed plus a first name sharing its first three letters ("Jordy" for Jordan)
  else if (has(typed, last)) score = Math.max(score, 50 + (typed.some((token) => token.length >= 3 && first[0]?.slice(0, 3) === token.slice(0, 3)) ? 20 : 0));
  else if (has(typed, first)) score = Math.max(score, 30);
  if (has(payer, first) && has(payer, last)) score = Math.max(score, 90);
  else if (has(payer, last)) score = Math.max(score, 35);
  return score;
}

/**
 * Searchable member picker grouped by section, with likely matches for the
 * payment pinned at the top.
 */
export function MemberPicker({
  members,
  value,
  onChange,
  memberName,
  customerName,
  payerHistory = [],
  disabled = false,
  error = false,
}: {
  members: PickerMember[];
  value: string;
  onChange: (memberId: string) => void;
  memberName?: string | null;
  customerName?: string | null;
  // Members this payer was already matched to this season
  payerHistory?: { memberId: string; count: number }[];
  disabled?: boolean;
  error?: boolean;
}) {
  const [query, setQuery] = useState('');

  const suggestions = useMemo(() => {
    const byId = new Map(members.map((member) => [member.id, member]));
    // Who this payer has paid for before comes first; name matches fill the rest
    const fromHistory = payerHistory
      .filter((entry) => byId.has(entry.memberId))
      .map((entry) => ({
        member: byId.get(entry.memberId)!,
        reason: `${customerName} paid for them ${entry.count === 1 ? 'once' : `${entry.count}×`} this season`,
      }));
    const seen = new Set(fromHistory.map((entry) => entry.member.id));
    const fromNames = members
      .filter((member) => !seen.has(member.id))
      .map((member) => ({ member, score: matchScore(member, memberName, customerName) }))
      .filter((entry) => entry.score >= 35)
      .sort((a, b) => b.score - a.score)
      .map((entry) => ({ member: entry.member, reason: 'Name match' }));
    return [...fromHistory, ...fromNames].slice(0, 3);
  }, [members, memberName, customerName, payerHistory]);

  const groups = useMemo(() => {
    const words = tokens(query);
    const matches = (member: PickerMember) => {
      if (words.length === 0) return true;
      const haystack = `${member.firstName} ${member.lastName} ${member.section ?? ''}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    };

    const bySection = new Map<string, PickerMember[]>();
    for (const member of members) {
      if (!matches(member)) continue;
      const section = member.section?.trim() || NO_SECTION;
      bySection.set(section, [...(bySection.get(section) ?? []), member]);
    }
    return [...bySection.entries()]
      .sort(([a], [b]) => (a === NO_SECTION ? 1 : b === NO_SECTION ? -1 : a.localeCompare(b)))
      .map(([section, list]) => ({
        section,
        members: list.sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)),
      }));
  }, [members, query]);

  const selected = members.find((member) => member.id === value) ?? null;
  const showSuggestions = !query && suggestions.length > 0;
  const resultCount = groups.reduce((sum, group) => sum + group.members.length, 0);

  return (
    <Combobox
      value={selected}
      onChange={(member: PickerMember | null) => {
        onChange(member?.id ?? '');
        setQuery('');
      }}
      onClose={() => setQuery('')}
      disabled={disabled}
      immediate
    >
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <ComboboxInput
          aria-label="Member"
          placeholder="Search name or section…"
          displayValue={(member: PickerMember | null) =>
            member ? `${member.firstName} ${member.lastName}${member.section ? ` · ${member.section}` : ''}` : ''
          }
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
          className={`min-h-[48px] w-full rounded-xl border bg-white py-3 pl-11 pr-10 text-base font-medium text-ink placeholder:font-normal placeholder:text-subtle focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-canvas disabled:opacity-50 ${
            error ? 'border-behind-line focus:ring-behind-line' : 'border-line focus:border-ink focus:ring-ink/10'
          }`}
        />
        {selected && !disabled && (
          <button
            type="button"
            aria-label="Clear member"
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:text-ink"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <ComboboxOptions
        anchor="bottom start"
        className="z-[70] mt-1 max-h-80 w-[var(--input-width)] min-w-[280px] overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-lg empty:invisible [--anchor-gap:4px]"
      >
        {showSuggestions && (
          <div>
            <div className="sticky top-0 z-10 bg-ink px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white">
              Likely match
            </div>
            {suggestions.map(({ member, reason }) => (
              <MemberOption key={`suggested-${member.id}`} member={member} reason={reason} />
            ))}
          </div>
        )}
        {groups.map((group) => (
          <div key={group.section}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-y border-line bg-wash px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
              <span>{group.section}</span>
              <span className="font-semibold">{group.members.length}</span>
            </div>
            {group.members.map((member) => (
              <MemberOption key={member.id} member={member} />
            ))}
          </div>
        ))}
        {resultCount === 0 && <div className="px-4 py-3 text-sm text-muted">No member matches &ldquo;{query}&rdquo;</div>}
      </ComboboxOptions>
    </Combobox>
  );
}

function MemberOption({ member, reason }: { member: PickerMember; reason?: string }) {
  return (
    <ComboboxOption
      value={member}
      className="group flex min-h-[44px] cursor-pointer items-center justify-between gap-3 px-4 py-2 text-ink data-[focus]:bg-canvas"
    >
      <span className="min-w-0">
        <span className="block truncate">
          <span className="font-semibold">{member.lastName}</span>, {member.firstName}
          {reason && member.section && <span className="text-muted"> · {member.section}</span>}
        </span>
        {reason && <span className="block truncate text-xs text-muted">{reason}</span>}
      </span>
      <CheckIcon className="invisible h-4 w-4 flex-none group-data-[selected]:visible" />
    </ComboboxOption>
  );
}
