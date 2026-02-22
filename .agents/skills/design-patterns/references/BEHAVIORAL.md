# Behavioral Patterns

Patterns concerned with algorithms, assignment of responsibilities, and
communication between objects.

---

## Chain of Responsibility

**Intent:** Pass a request along a chain of handlers. Each handler decides
whether to process or pass to the next.

**When to Use:**

- Multiple objects might handle a request, decided at runtime
- Processing pipeline where handlers can be added/removed dynamically
- You want to decouple senders from receivers

```typescript
interface Request {
  type: string;
  payload: unknown;
  handled?: boolean;
}

abstract class Handler {
  private next?: Handler;

  setNext(handler: Handler): Handler {
    this.next = handler;
    return handler;
  }

  handle(request: Request): Request {
    if (this.next) {
      return this.next.handle(request);
    }
    return request;
  }
}

class AuthHandler extends Handler {
  handle(request: Request) {
    const token = (request.payload as any)?.token;
    if (!token) {
      throw new Error("Authentication required");
    }
    console.log("Auth: verified");
    return super.handle(request);
  }
}

class RateLimitHandler extends Handler {
  private requests = new Map<string, number>();

  handle(request: Request) {
    const ip = (request.payload as any)?.ip ?? "unknown";
    const count = (this.requests.get(ip) ?? 0) + 1;
    this.requests.set(ip, count);

    if (count > 100) {
      throw new Error("Rate limit exceeded");
    }
    console.log(`Rate limit: ${count}/100`);
    return super.handle(request);
  }
}

class ValidationHandler extends Handler {
  handle(request: Request) {
    const body = (request.payload as any)?.body;
    if (!body || Object.keys(body).length === 0) {
      throw new Error("Validation failed: empty body");
    }
    console.log("Validation: passed");
    return super.handle({ ...request, handled: true });
  }
}

// Usage — build the chain
const auth = new AuthHandler();
const rateLimit = new RateLimitHandler();
const validation = new ValidationHandler();

auth.setNext(rateLimit).setNext(validation);

auth.handle({
  type: "create_user",
  payload: { token: "abc123", ip: "192.168.1.1", body: { name: "Alice" } },
});
```

**Key Points:**

- Handlers form a linked list; each calls `super.handle()` to pass along
- The chain is configurable — add, remove, or reorder handlers freely
- Common in middleware stacks (Express, Hono, etc.)

---

## Command

**Intent:** Encapsulate a request as an object, allowing parameterization,
queuing, logging, and undo operations.

**When to Use:**

- Implementing undo/redo
- Task queues and job scheduling
- Macro recording (replay sequences of actions)
- Decoupling UI actions from business logic

```typescript
interface Command {
  execute(): void;
  undo(): void;
}

interface EditorState {
  content: string;
  cursorPosition: number;
}

class Editor {
  state: EditorState = { content: "", cursorPosition: 0 };

  getContent() {
    return this.state.content;
  }
}

class InsertTextCommand implements Command {
  private previousContent = "";

  constructor(
    private editor: Editor,
    private text: string,
    private position: number,
  ) {}

  execute() {
    this.previousContent = this.editor.state.content;
    const before = this.editor.state.content.slice(0, this.position);
    const after = this.editor.state.content.slice(this.position);
    this.editor.state.content = before + this.text + after;
    this.editor.state.cursorPosition = this.position + this.text.length;
  }

  undo() {
    this.editor.state.content = this.previousContent;
    this.editor.state.cursorPosition = this.position;
  }
}

class DeleteTextCommand implements Command {
  private deletedText = "";

  constructor(
    private editor: Editor,
    private position: number,
    private length: number,
  ) {}

  execute() {
    this.deletedText = this.editor.state.content.slice(
      this.position,
      this.position + this.length,
    );
    const before = this.editor.state.content.slice(0, this.position);
    const after = this.editor.state.content.slice(this.position + this.length);
    this.editor.state.content = before + after;
    this.editor.state.cursorPosition = this.position;
  }

  undo() {
    const before = this.editor.state.content.slice(0, this.position);
    const after = this.editor.state.content.slice(this.position);
    this.editor.state.content = before + this.deletedText + after;
  }
}

class CommandHistory {
  private history: Command[] = [];
  private undone: Command[] = [];

  execute(command: Command) {
    command.execute();
    this.history.push(command);
    this.undone = []; // clear redo stack on new action
  }

  undo() {
    const command = this.history.pop();
    if (command) {
      command.undo();
      this.undone.push(command);
    }
  }

  redo() {
    const command = this.undone.pop();
    if (command) {
      command.execute();
      this.history.push(command);
    }
  }
}

// Usage
const editor = new Editor();
const history = new CommandHistory();

history.execute(new InsertTextCommand(editor, "Hello", 0));
history.execute(new InsertTextCommand(editor, " World", 5));
console.log(editor.getContent()); // "Hello World"

history.undo();
console.log(editor.getContent()); // "Hello"

history.redo();
console.log(editor.getContent()); // "Hello World"
```

**Key Points:**

- Each command stores enough state to undo itself
- CommandHistory manages the undo/redo stacks
- Commands can be serialized, queued, or composed into macros

---

## Iterator

**Intent:** Provide a way to access elements of a collection sequentially
without exposing its underlying structure.

**When to Use:**

- Traversing complex data structures (trees, graphs, custom collections)
- Providing multiple traversal strategies for the same collection
- Hiding collection implementation details from consumers

```typescript
interface Iterator<T> {
  hasNext(): boolean;
  next(): T;
  reset(): void;
}

class TreeNode<T> {
  children: TreeNode<T>[] = [];
  constructor(public value: T) {}

  add(child: TreeNode<T>) {
    this.children.push(child);
    return this;
  }
}

// Depth-first iterator
class DepthFirstIterator<T> implements Iterator<T> {
  private stack: TreeNode<T>[];

  constructor(private root: TreeNode<T>) {
    this.stack = [root];
  }

  hasNext() {
    return this.stack.length > 0;
  }

  next(): T {
    const node = this.stack.pop()!;
    // Push children in reverse so leftmost is processed first
    for (let i = node.children.length - 1; i >= 0; i--) {
      this.stack.push(node.children[i]);
    }
    return node.value;
  }

  reset() {
    this.stack = [this.root];
  }
}

// Breadth-first iterator
class BreadthFirstIterator<T> implements Iterator<T> {
  private queue: TreeNode<T>[];

  constructor(private root: TreeNode<T>) {
    this.queue = [root];
  }

  hasNext() {
    return this.queue.length > 0;
  }

  next(): T {
    const node = this.queue.shift()!;
    this.queue.push(...node.children);
    return node.value;
  }

  reset() {
    this.queue = [this.root];
  }
}

// Usage
const root = new TreeNode("root")
  .add(new TreeNode("a").add(new TreeNode("a1")).add(new TreeNode("a2")))
  .add(new TreeNode("b").add(new TreeNode("b1")));

const dfs = new DepthFirstIterator(root);
const dfsResult: string[] = [];
while (dfs.hasNext()) dfsResult.push(dfs.next());
console.log(dfsResult); // ["root", "a", "a1", "a2", "b", "b1"]

const bfs = new BreadthFirstIterator(root);
const bfsResult: string[] = [];
while (bfs.hasNext()) bfsResult.push(bfs.next());
console.log(bfsResult); // ["root", "a", "b", "a1", "a2", "b1"]
```

**Key Points:**

- TS has built-in `Symbol.iterator` and `for...of` support — use when possible
- Custom iterators are useful for non-linear structures (trees, graphs)
- Generators (`function*`) are often simpler for custom iteration in TS

---

## Mediator

**Intent:** Define an object that encapsulates how a set of objects interact,
reducing direct coupling between them.

**When to Use:**

- Multiple objects communicate in complex ways
- You want to centralize control logic instead of scattering it
- Reducing many-to-many relationships to many-to-one

```typescript
interface ChatMediator {
  sendMessage(message: string, sender: User): void;
  addUser(user: User): void;
}

class User {
  constructor(
    public name: string,
    private mediator: ChatMediator,
  ) {
    mediator.addUser(this);
  }

  send(message: string) {
    console.log(`${this.name} sends: ${message}`);
    this.mediator.sendMessage(message, this);
  }

  receive(message: string, from: string) {
    console.log(`${this.name} receives from ${from}: ${message}`);
  }
}

class ChatRoom implements ChatMediator {
  private users: User[] = [];

  addUser(user: User) {
    this.users.push(user);
  }

  sendMessage(message: string, sender: User) {
    this.users
      .filter((user) => user !== sender)
      .forEach((user) => user.receive(message, sender.name));
  }
}

// Usage — users don't reference each other directly
const chatRoom = new ChatRoom();
const alice = new User("Alice", chatRoom);
const bob = new User("Bob", chatRoom);
const charlie = new User("Charlie", chatRoom);

alice.send("Hello everyone!");
// Bob receives from Alice: Hello everyone!
// Charlie receives from Alice: Hello everyone!
```

**Key Points:**

- Users communicate through the mediator, never directly
- Adding new participants doesn't require changing existing ones
- The mediator can add logic: filtering, routing, logging

---

## Memento

**Intent:** Capture and externalize an object's internal state so it can be
restored later, without violating encapsulation.

**When to Use:**

- Implementing undo/redo (often combined with Command)
- Saving checkpoints or snapshots
- State rollback on errors

```typescript
// Memento — immutable snapshot
class EditorMemento {
  constructor(
    readonly content: string,
    readonly cursorPosition: number,
    readonly selectionStart: number | null,
    readonly selectionEnd: number | null,
    readonly timestamp: Date = new Date(),
  ) {}
}

// Originator — creates and restores from mementos
class TextEditor {
  private content = "";
  private cursorPosition = 0;
  private selectionStart: number | null = null;
  private selectionEnd: number | null = null;

  type(text: string) {
    const before = this.content.slice(0, this.cursorPosition);
    const after = this.content.slice(this.cursorPosition);
    this.content = before + text + after;
    this.cursorPosition += text.length;
    this.selectionStart = null;
    this.selectionEnd = null;
  }

  save(): EditorMemento {
    return new EditorMemento(
      this.content,
      this.cursorPosition,
      this.selectionStart,
      this.selectionEnd,
    );
  }

  restore(memento: EditorMemento) {
    this.content = memento.content;
    this.cursorPosition = memento.cursorPosition;
    this.selectionStart = memento.selectionStart;
    this.selectionEnd = memento.selectionEnd;
  }

  getContent() {
    return this.content;
  }
}

// Caretaker — manages memento history
class History {
  private snapshots: EditorMemento[] = [];

  push(memento: EditorMemento) {
    this.snapshots.push(memento);
  }

  pop(): EditorMemento | undefined {
    return this.snapshots.pop();
  }
}

// Usage
const editor = new TextEditor();
const history = new History();

history.push(editor.save());
editor.type("Hello");

history.push(editor.save());
editor.type(" World");

console.log(editor.getContent()); // "Hello World"

editor.restore(history.pop()!);
console.log(editor.getContent()); // "Hello"

editor.restore(history.pop()!);
console.log(editor.getContent()); // ""
```

**Key Points:**

- Memento is opaque to the caretaker — it can't inspect or modify the state
- Keep mementos lightweight; for large state, consider storing diffs
- Often paired with Command pattern for undo/redo systems

---

## Observer

**Intent:** Define a one-to-many dependency so that when one object changes
state, all dependents are notified automatically.

**When to Use:**

- Event systems and event-driven architectures
- UI state synchronization
- Pub/sub messaging
- Reactive programming foundations

```typescript
type EventHandler<T = unknown> = (data: T) => void;

class EventEmitter {
  private listeners = new Map<string, Set<EventHandler>>();

  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  off<T>(event: string, handler: EventHandler<T>) {
    this.listeners.get(event)?.delete(handler as EventHandler);
  }

  emit<T>(event: string, data: T) {
    this.listeners.get(event)?.forEach((handler) => handler(data));
  }

  once<T>(event: string, handler: EventHandler<T>): () => void {
    const wrapper: EventHandler<T> = (data) => {
      handler(data);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }
}

// Usage
interface OrderEvent {
  orderId: string;
  total: number;
}

const events = new EventEmitter();

// Subscribe
const unsubscribe = events.on<OrderEvent>("order:created", (order) => {
  console.log(`Send confirmation email for order ${order.orderId}`);
});

events.on<OrderEvent>("order:created", (order) => {
  console.log(`Update inventory for order ${order.orderId}`);
});

events.on<OrderEvent>("order:created", (order) => {
  if (order.total > 1000) {
    console.log(`Flag large order ${order.orderId} for review`);
  }
});

// Publish
events.emit("order:created", { orderId: "ORD-001", total: 1500 });

// Unsubscribe
unsubscribe();
```

**Key Points:**

- Return unsubscribe functions to avoid memory leaks
- `once()` is a common convenience method
- Type the events for better DX (typed EventEmitter with generics)
- Foundation of many frameworks: DOM events, Node EventEmitter, RxJS

---

## State

**Intent:** Allow an object to alter its behavior when its internal state
changes. The object appears to change its class.

**When to Use:**

- Object behavior depends heavily on its state
- Complex state-dependent conditionals (replacing if/switch chains)
- Finite state machines (order processing, game states, UI flows)

```typescript
interface ConnectionState {
  connect(ctx: TcpConnection): void;
  disconnect(ctx: TcpConnection): void;
  send(ctx: TcpConnection, data: string): void;
}

class DisconnectedState implements ConnectionState {
  connect(ctx: TcpConnection) {
    console.log("Connecting...");
    ctx.setState(new ConnectingState());
    // Simulate async connection
    setTimeout(() => ctx.setState(new ConnectedState()), 100);
  }

  disconnect(_ctx: TcpConnection) {
    console.log("Already disconnected");
  }

  send(_ctx: TcpConnection, _data: string) {
    throw new Error("Cannot send: not connected");
  }
}

class ConnectingState implements ConnectionState {
  connect(_ctx: TcpConnection) {
    console.log("Already connecting...");
  }

  disconnect(ctx: TcpConnection) {
    console.log("Canceling connection...");
    ctx.setState(new DisconnectedState());
  }

  send(_ctx: TcpConnection, _data: string) {
    throw new Error("Cannot send: still connecting");
  }
}

class ConnectedState implements ConnectionState {
  connect(_ctx: TcpConnection) {
    console.log("Already connected");
  }

  disconnect(ctx: TcpConnection) {
    console.log("Disconnecting...");
    ctx.setState(new DisconnectedState());
  }

  send(_ctx: TcpConnection, data: string) {
    console.log(`Sending: ${data}`);
  }
}

class TcpConnection {
  private state: ConnectionState = new DisconnectedState();

  setState(state: ConnectionState) {
    this.state = state;
  }

  connect() {
    this.state.connect(this);
  }
  disconnect() {
    this.state.disconnect(this);
  }
  send(data: string) {
    this.state.send(this, data);
  }
}

// Usage
const conn = new TcpConnection();
conn.send("hello"); // Error: Cannot send: not connected
conn.connect(); // Connecting...
conn.send("hello"); // Error: Cannot send: still connecting
// After 100ms...
conn.send("hello"); // Sending: hello
conn.disconnect(); // Disconnecting...
```

**Key Points:**

- Each state is a separate class implementing the same interface
- Context delegates to the current state object
- Eliminates complex if/switch chains on state variables
- State transitions are explicit and self-documenting

---

## Strategy

**Intent:** Define a family of algorithms, encapsulate each one, and make them
interchangeable at runtime.

**When to Use:**

- Multiple algorithms for the same task (sorting, compression, pricing)
- You want to swap algorithms without modifying client code
- Eliminating conditional logic for algorithm selection

```typescript
interface PricingStrategy {
  calculate(basePrice: number, quantity: number): number;
}

class RegularPricing implements PricingStrategy {
  calculate(basePrice: number, quantity: number) {
    return basePrice * quantity;
  }
}

class BulkPricing implements PricingStrategy {
  constructor(private threshold: number, private discount: number) {}

  calculate(basePrice: number, quantity: number) {
    if (quantity >= this.threshold) {
      return basePrice * quantity * (1 - this.discount);
    }
    return basePrice * quantity;
  }
}

class SeasonalPricing implements PricingStrategy {
  constructor(private multiplier: number) {}

  calculate(basePrice: number, quantity: number) {
    return basePrice * quantity * this.multiplier;
  }
}

class TieredPricing implements PricingStrategy {
  constructor(private tiers: { upTo: number; discount: number }[]) {}

  calculate(basePrice: number, quantity: number) {
    let remaining = quantity;
    let total = 0;

    for (const tier of this.tiers) {
      const tierQty = Math.min(remaining, tier.upTo);
      total += basePrice * tierQty * (1 - tier.discount);
      remaining -= tierQty;
      if (remaining <= 0) break;
    }

    // Remaining units at base price
    total += basePrice * remaining;
    return total;
  }
}

class ShoppingCart {
  constructor(private pricing: PricingStrategy) {}

  setPricing(strategy: PricingStrategy) {
    this.pricing = strategy;
  }

  checkout(basePrice: number, quantity: number) {
    return this.pricing.calculate(basePrice, quantity);
  }
}

// Usage
const cart = new ShoppingCart(new RegularPricing());
console.log(cart.checkout(100, 5)); // 500

cart.setPricing(new BulkPricing(3, 0.1));
console.log(cart.checkout(100, 5)); // 450

cart.setPricing(new SeasonalPricing(1.25));
console.log(cart.checkout(100, 5)); // 625
```

**Key Points:**

- In TS/JS, strategies can simply be functions instead of classes
- Strategy is selected at runtime — great for A/B testing, feature flags, user tiers
- Eliminates switch/if-else chains for algorithm selection

---

## Template Method

**Intent:** Define the skeleton of an algorithm in a base class, letting
subclasses override specific steps without changing the overall structure.

**When to Use:**

- Several classes share the same algorithm structure but differ in steps
- You want to enforce an algorithm's order while allowing customization
- Reducing code duplication across similar implementations

```typescript
abstract class DataProcessor {
  // Template method — defines the algorithm skeleton
  process(source: string): string[] {
    const raw = this.readData(source);
    const parsed = this.parseData(raw);
    const filtered = this.filterData(parsed);
    const transformed = this.transformData(filtered);
    this.saveResults(transformed);
    return transformed;
  }

  // Steps to be overridden by subclasses
  protected abstract readData(source: string): string;
  protected abstract parseData(raw: string): string[];

  // Optional hook with default behavior
  protected filterData(data: string[]): string[] {
    return data.filter((item) => item.trim().length > 0);
  }

  protected transformData(data: string[]): string[] {
    return data;
  }

  protected saveResults(data: string[]) {
    console.log(`Processed ${data.length} records`);
  }
}

class CSVProcessor extends DataProcessor {
  protected readData(source: string) {
    console.log(`Reading CSV from ${source}`);
    return "name,age,city\nAlice,30,NYC\nBob,25,LA\n,, ";
  }

  protected parseData(raw: string) {
    return raw
      .split("\n")
      .slice(1)
      .map((line) => line.trim());
  }

  protected transformData(data: string[]) {
    return data.map((line) => line.toUpperCase());
  }
}

class JSONProcessor extends DataProcessor {
  protected readData(source: string) {
    console.log(`Reading JSON from ${source}`);
    return '[{"name":"Alice"},{"name":"Bob"},{"name":""}]';
  }

  protected parseData(raw: string) {
    const items = JSON.parse(raw) as { name: string }[];
    return items.map((item) => item.name);
  }
}

// Usage — same algorithm structure, different implementations
const csv = new CSVProcessor();
csv.process("data.csv");
// Reading CSV from data.csv
// Processed 2 records (empty row filtered, remaining uppercased)

const json = new JSONProcessor();
json.process("data.json");
// Reading JSON from data.json
// Processed 2 records (empty name filtered)
```

**Key Points:**

- The template method (`process()`) is not meant to be overridden
- Abstract methods are required steps; hooks (with defaults) are optional
- Follows the Hollywood Principle: "Don't call us, we'll call you"
- Prefer composition (Strategy) when the variations are independent of each other

---

## Visitor

**Intent:** Separate algorithms from the objects they operate on. Add new
operations to existing object structures without modifying them.

**When to Use:**

- Performing many distinct operations on a complex object structure
- Object structure is stable, but operations change frequently
- You want to avoid polluting classes with unrelated operations

```typescript
// Element types (stable structure)
interface ASTNode {
  accept(visitor: ASTVisitor): unknown;
}

class NumberLiteral implements ASTNode {
  constructor(public value: number) {}
  accept(visitor: ASTVisitor) {
    return visitor.visitNumber(this);
  }
}

class StringLiteral implements ASTNode {
  constructor(public value: string) {}
  accept(visitor: ASTVisitor) {
    return visitor.visitString(this);
  }
}

class BinaryExpression implements ASTNode {
  constructor(
    public left: ASTNode,
    public operator: "+" | "-" | "*" | "/",
    public right: ASTNode,
  ) {}
  accept(visitor: ASTVisitor) {
    return visitor.visitBinaryExpression(this);
  }
}

// Visitor interface
interface ASTVisitor {
  visitNumber(node: NumberLiteral): unknown;
  visitString(node: StringLiteral): unknown;
  visitBinaryExpression(node: BinaryExpression): unknown;
}

// Visitor: evaluate expressions
class Evaluator implements ASTVisitor {
  visitNumber(node: NumberLiteral) {
    return node.value;
  }

  visitString(node: StringLiteral) {
    return node.value;
  }

  visitBinaryExpression(node: BinaryExpression): number {
    const left = node.left.accept(this) as number;
    const right = node.right.accept(this) as number;
    switch (node.operator) {
      case "+": return left + right;
      case "-": return left - right;
      case "*": return left * right;
      case "/": return left / right;
    }
  }
}

// Visitor: pretty print
class PrettyPrinter implements ASTVisitor {
  visitNumber(node: NumberLiteral) {
    return String(node.value);
  }

  visitString(node: StringLiteral) {
    return `"${node.value}"`;
  }

  visitBinaryExpression(node: BinaryExpression): string {
    const left = node.left.accept(this);
    const right = node.right.accept(this);
    return `(${left} ${node.operator} ${right})`;
  }
}

// Usage — add operations without modifying node classes
const ast = new BinaryExpression(
  new BinaryExpression(new NumberLiteral(3), "*", new NumberLiteral(4)),
  "+",
  new NumberLiteral(5),
);

const evaluator = new Evaluator();
console.log(ast.accept(evaluator)); // 17

const printer = new PrettyPrinter();
console.log(ast.accept(printer)); // "((3 * 4) + 5)"
```

**Key Points:**

- Uses "double dispatch": element calls visitor method, passing itself
- Easy to add new visitors (operations); hard to add new element types
- Common in compilers, linters, serializers, code analysis tools
- If element types change frequently, Visitor is not a good fit
