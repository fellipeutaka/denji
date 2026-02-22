# TanStack Hotkeys — React API Reference

## Table of Contents

- [React Hooks](#react-hooks)
- [React Components](#react-components)
- [React Interfaces](#react-interfaces)
- [Core Utility Functions](#core-utility-functions)
- [Core Interfaces & Types](#core-interfaces--types)
- [Core Classes](#core-classes)
- [Constants](#constants)

## React Hooks

### `useHotkey(hotkey, callback, options?): void`

Register a keyboard shortcut. `hotkey`: `RegisterableHotkey` (string like `'Mod+S'` or `RawHotkey` object). `callback`: `(event: KeyboardEvent, context: HotkeyCallbackContext) => void`. `options`: `UseHotkeyOptions`.

### `useHotkeySequence(sequence, callback, options?): void`

Register multi-key sequence. `sequence`: `HotkeySequence` (array of hotkey strings). `options`: `UseHotkeySequenceOptions`.

### `useHotkeyRecorder(options): ReactHotkeyRecorder`

Record keyboard shortcuts. `options`: `HotkeyRecorderOptions` (requires `onRecord`). Returns `ReactHotkeyRecorder`.

### `useHeldKeys(): string[]`

Reactive array of currently held key names.

### `useHeldKeyCodes(): Record<string, string>`

Reactive map of held key names to `event.code` values. Useful for distinguishing left/right modifiers.

### `useKeyHold(key: HeldKey): boolean`

Whether a specific key is held. Optimized: only re-renders when that key's state changes.

### `useHotkeysContext(): HotkeysContextValue | null`

Access the HotkeysProvider context.

### `useDefaultHotkeysOptions(): HotkeysProviderOptions`

Get current default options from provider.

## React Components

### `HotkeysProvider`

Props: `{ children: ReactNode, defaultOptions?: HotkeysProviderOptions }`

## React Interfaces

### `UseHotkeyOptions`

Extends `Omit<HotkeyOptions, 'target'>`. Adds:

- `target?`: `HTMLElement | Document | Window | RefObject<HTMLElement | null> | null` — defaults to `document`

### `UseHotkeySequenceOptions`

Extends `Omit<SequenceOptions, 'enabled'>`. Adds:

- `enabled?`: `boolean` — defaults to `true`

### `HotkeysProviderOptions`

- `hotkey?`: `Partial<UseHotkeyOptions>`
- `hotkeyRecorder?`: `Partial<HotkeyRecorderOptions>`
- `hotkeySequence?`: `Partial<UseHotkeySequenceOptions>`

### `ReactHotkeyRecorder`

- `isRecording`: `boolean`
- `recordedHotkey`: `Hotkey | null`
- `startRecording()`: `void`
- `stopRecording()`: `void`
- `cancelRecording()`: `void`

## Core Utility Functions

### Formatting

- `formatForDisplay(hotkey, options?): string` — platform-aware symbols (Mac: `⌘S`, Windows: `Ctrl+S`). Options: `{ platform?: 'mac' | 'windows' | 'linux' }`
- `formatWithLabels(hotkey, options?): string` — text labels (Mac: `Cmd+S`, Windows: `Ctrl+S`)
- `formatHotkey(parsed: ParsedHotkey): string` — convert ParsedHotkey back to canonical string
- `formatKeyForDebuggingDisplay(key, options?): string` — rich label for devtools (e.g., `⌘ Mod (Cmd)`)

### Parsing & Normalization

- `parseHotkey(hotkey: string, platform?): ParsedHotkey` — parse string into components
- `normalizeHotkey(hotkey: string, platform?): string` — canonical form
- `parseKeyboardEvent(event: KeyboardEvent): object` — extract key info from event
- `keyboardEventToHotkey(event: KeyboardEvent): Hotkey` — convert event to hotkey string
- `normalizeKeyName(key: string): string` — normalize a key name

### Validation

- `validateHotkey(hotkey: string): ValidationResult` — returns `{ valid, warnings, errors }`
- `assertValidHotkey(hotkey: string): void` — throws if invalid

### Matching

- `matchesKeyboardEvent(hotkey, event, platform?): boolean` — test if event matches hotkey
- `checkHotkey(hotkey, event, options?): boolean` — check with full options

### Conversion

- `rawHotkeyToParsedHotkey(raw: RawHotkey, platform?): ParsedHotkey`
- `convertToModFormat(hotkey: Hotkey, platform?): Hotkey` — convert platform-specific to portable `Mod` format
- `resolveModifier(platform?): 'Meta' | 'Control'`
- `detectPlatform(): 'mac' | 'windows' | 'linux'`

### Key Utilities

- `isModifier(key: string): boolean`
- `isModifierKey(key: string): boolean`
- `hasNonModifierKey(parsed: ParsedHotkey): boolean`

### Handlers

- `createHotkeyHandler(hotkey, callback, options?): (event: KeyboardEvent) => void`
- `createMultiHotkeyHandler(entries): (event: KeyboardEvent) => void`
- `createSequenceMatcher(sequence, options?): object` — standalone sequence matcher with `match(event)` and `getProgress()`

## Core Interfaces & Types

### `HotkeyOptions`

- `enabled?`: `boolean` (default `true`)
- `preventDefault?`: `boolean` (default `true`)
- `stopPropagation?`: `boolean` (default `true`)
- `eventType?`: `'keydown' | 'keyup'` (default `'keydown'`)
- `requireReset?`: `boolean` (default `false`)
- `ignoreInputs?`: `boolean` (smart default based on hotkey type)
- `target?`: `Document | Window | HTMLElement | null` (default `document`)
- `platform?`: `'mac' | 'windows' | 'linux'`
- `conflictBehavior?`: `ConflictBehavior` (default `'warn'`)

### `SequenceOptions`

Extends `HotkeyOptions`. Adds:

- `timeout?`: `number` (default `1000`)

### `HotkeyRecorderOptions`

- `onRecord(hotkey: Hotkey): void` (required)
- `onCancel?(): void`
- `onClear?(): void`

### `RawHotkey`

- `key`: `Key | string`
- `mod?`: `boolean` (platform-adaptive: Cmd on Mac, Ctrl on Windows/Linux)
- `ctrl?`: `boolean`
- `shift?`: `boolean`
- `alt?`: `boolean`
- `meta?`: `boolean`

### `ParsedHotkey`

- `key`: `string`
- `ctrl`: `boolean`
- `shift`: `boolean`
- `alt`: `boolean`
- `meta`: `boolean`
- `modifiers`: `CanonicalModifier[]`

### `HotkeyCallbackContext`

- `hotkey`: `Hotkey` — original registered string
- `parsedHotkey`: `ParsedHotkey`

### `ValidationResult`

- `valid`: `boolean`
- `warnings`: `string[]`
- `errors`: `string[]`

### Type Aliases

- `Hotkey` — type-safe hotkey string (e.g., `'Mod+S'`, `'Control+Shift+A'`)
- `HotkeySequence` — array of `Hotkey` strings
- `RegisterableHotkey` — `Hotkey | RawHotkey`
- `HotkeyCallback` — `(event: KeyboardEvent, context: HotkeyCallbackContext) => void`
- `HeldKey` — key name for tracking (`'Shift'`, `'Control'`, `'A'`, etc.)
- `Key` — union of all valid key names
- `Modifier` — `'Control' | 'Shift' | 'Alt' | 'Meta' | 'Mod'`
- `CanonicalModifier` — `'Control' | 'Shift' | 'Alt' | 'Meta'`
- `ConflictBehavior` — `'warn' | 'error' | 'replace' | 'allow'`

## Core Classes

### `HotkeyManager` (singleton via `getHotkeyManager()`)

- `register(hotkey, callback, options?): HotkeyRegistrationHandle`
- `unregister(handle): void`
- `isRegistered(hotkey): boolean`
- `getRegistrationCount(): number`

### `SequenceManager` (singleton via `getSequenceManager()`)

Manages all sequence registrations. Used internally by `useHotkeySequence`.

### `KeyStateTracker` (singleton via `getKeyStateTracker()`)

- `getHeldKeys(): string[]`
- `isKeyHeld(key): boolean`
- `isAnyKeyHeld(keys): boolean`
- `areAllKeysHeld(keys): boolean`

### `HotkeyRecorder`

Framework-agnostic recorder class. Used internally by `useHotkeyRecorder`.

## Constants

- `MODIFIER_KEYS` — set of modifier key names
- `MODIFIER_ORDER` — canonical modifier ordering
- `MODIFIER_ALIASES` — aliases (e.g., `Cmd` -> `Meta`)
- `KEY_DISPLAY_SYMBOLS` — key-to-symbol mapping
- `MAC_MODIFIER_SYMBOLS` — Mac modifier symbols (`⌘`, `⇧`, `⌃`, `⌥`)
- `STANDARD_MODIFIER_LABELS` — text labels for modifiers
- `LETTER_KEYS`, `NUMBER_KEYS`, `FUNCTION_KEYS`, `NAVIGATION_KEYS`, `EDITING_KEYS`, `PUNCTUATION_KEYS`, `ALL_KEYS`
