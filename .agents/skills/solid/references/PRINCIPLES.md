# SOLID Principles — Detailed Reference

## S — Single Responsibility Principle (SRP)

> "A class should have one, and only one, reason to change."

A "reason to change" means one stakeholder or business concern. If different
people would request changes to different parts of the class, it has too many
responsibilities.

### Problem It Solves

God objects that mix persistence, business logic, presentation, and
notifications — hard to test, hard to change, hard to understand.

### Before (Violates SRP)

```typescript
class Order {
  private items: OrderItem[] = [];

  addItem(item: OrderItem) {
    this.items.push(item);
  }

  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  // Persistence concern
  async saveToDatabase(db: Database) {
    await db.query("INSERT INTO orders ...", this.toJSON());
  }

  // Presentation concern
  generateInvoiceHTML(): string {
    return `<h1>Invoice</h1><p>Total: ${this.calculateTotal()}</p>`;
  }

  // Notification concern
  async sendConfirmationEmail(emailClient: EmailClient) {
    await emailClient.send(this.customerEmail, "Order confirmed");
  }
}
```

### After (SRP Applied)

```typescript
// Domain logic only
class Order {
  private items: OrderItem[] = [];

  addItem(item: OrderItem) {
    this.items.push(item);
  }

  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}

// Persistence
class OrderRepository {
  constructor(private db: Database) {}

  async save(order: Order): Promise<void> {
    await this.db.query("INSERT INTO orders ...", order.toJSON());
  }
}

// Presentation
class InvoiceGenerator {
  generate(order: Order): string {
    return `<h1>Invoice</h1><p>Total: ${order.calculateTotal()}</p>`;
  }
}

// Notification
class OrderNotifier {
  constructor(private emailClient: EmailClient) {}

  async sendConfirmation(order: Order): Promise<void> {
    await this.emailClient.send(order.customerEmail, "Order confirmed");
  }
}
```

### Detection

- Can you describe the class without using "and"?
- Would different teams/stakeholders request changes to different parts?
- Does a single change require modifying unrelated code in the same class?

---

## O — Open/Closed Principle (OCP)

> "Software entities should be open for extension but closed for modification."

You should be able to add new behavior without editing existing, tested code.

### Problem It Solves

Every new feature requires modifying existing code, risking regressions in
working functionality. Growing `if/else` or `switch` chains.

### Before (Violates OCP)

```typescript
class ShippingCalculator {
  calculate(method: string, orderValue: number): number {
    if (method === "standard") {
      return orderValue < 50 ? 5 : 0;
    }
    if (method === "express") {
      return 15;
    }
    if (method === "overnight") {
      return 25;
    }
    // Must add more ifs for every new method!
    throw new Error(`Unknown shipping method: ${method}`);
  }
}
```

### After (OCP Applied)

```typescript
interface ShippingMethod {
  calculateCost(orderValue: number): number;
}

class StandardShipping implements ShippingMethod {
  calculateCost(orderValue: number) {
    return orderValue < 50 ? 5 : 0;
  }
}

class ExpressShipping implements ShippingMethod {
  calculateCost(orderValue: number) {
    return 15;
  }
}

class OvernightShipping implements ShippingMethod {
  calculateCost(orderValue: number) {
    return 25;
  }
}

// Adding a new method = adding a new class, no existing code modified
class SameDayShipping implements ShippingMethod {
  calculateCost(orderValue: number) {
    return 35;
  }
}

class ShippingCalculator {
  calculate(method: ShippingMethod, orderValue: number): number {
    return method.calculateCost(orderValue);
  }
}
```

### Detection

- Do you modify existing code to add new variants?
- Are there `switch`/`if-else` chains on a type/kind field?
- Does adding a feature touch multiple existing files?

### Techniques

- **Strategy pattern** — swap algorithms via interface
- **Decorator pattern** — add behavior by wrapping
- **Plugin architecture** — register new modules without editing core

---

## L — Liskov Substitution Principle (LSP)

> "Subtypes must be substitutable for their base types without altering program
> correctness."

If code works with a base type, it must work correctly with any subtype —
no surprises, no special cases.

### Problem It Solves

Subclasses that break expectations, forcing calling code to type-check or
handle special cases. Fragile hierarchies.

### Before (Violates LSP)

```typescript
class Rectangle {
  constructor(
    protected width: number,
    protected height: number,
  ) {}

  setWidth(w: number) {
    this.width = w;
  }

  setHeight(h: number) {
    this.height = h;
  }

  getArea(): number {
    return this.width * this.height;
  }
}

class Square extends Rectangle {
  setWidth(w: number) {
    this.width = w;
    this.height = w; // Surprise! Changes height too
  }

  setHeight(h: number) {
    this.width = h; // Surprise! Changes width too
    this.height = h;
  }
}

// Breaks with Square — caller expects independent width/height
function doubleWidth(rect: Rectangle) {
  const originalHeight = rect.getArea() / rect.getArea(); // just for illustration
  rect.setWidth(rect.getArea() / 10); // height unexpectedly changes
}
```

### After (LSP Applied)

```typescript
interface Shape {
  getArea(): number;
}

class Rectangle implements Shape {
  constructor(
    private width: number,
    private height: number,
  ) {}

  getArea() {
    return this.width * this.height;
  }
}

class Square implements Shape {
  constructor(private side: number) {}

  getArea() {
    return this.side * this.side;
  }
}

// Both work correctly — no shared mutable contract to violate
function printArea(shape: Shape) {
  console.log(`Area: ${shape.getArea()}`);
}
```

### Contract Rules

A subtype must honor the base type's contract:

- **Preconditions** cannot be strengthened (don't require more)
- **Postconditions** cannot be weakened (don't promise less)
- **Invariants** must be preserved
- **No new exceptions** that the base type doesn't throw

### Detection

- Does calling code use `instanceof` checks?
- Does a subclass throw "not supported" for inherited methods?
- Does substituting a subtype produce unexpected behavior?

---

## I — Interface Segregation Principle (ISP)

> "Clients should not be forced to depend on methods they do not use."

### Problem It Solves

Fat interfaces that force implementors to stub out methods they don't need.
Unnecessary coupling to unrelated functionality.

### Before (Violates ISP)

```typescript
interface Worker {
  code(): void;
  test(): void;
  design(): void;
  attendMeeting(): void;
  writeDocumentation(): void;
}

class JuniorDeveloper implements Worker {
  code() {
    /* OK */
  }
  test() {
    /* OK */
  }
  design() {
    throw new Error("Not my job");
  }
  attendMeeting() {
    /* OK */
  }
  writeDocumentation() {
    throw new Error("Not my job");
  }
}
```

### After (ISP Applied)

```typescript
interface Coder {
  code(): void;
}

interface Tester {
  test(): void;
}

interface Designer {
  design(): void;
}

interface MeetingAttendee {
  attendMeeting(): void;
}

interface DocumentationWriter {
  writeDocumentation(): void;
}

class JuniorDeveloper implements Coder, Tester, MeetingAttendee {
  code() {
    /* OK */
  }
  test() {
    /* OK */
  }
  attendMeeting() {
    /* OK */
  }
}

class SeniorDeveloper
  implements Coder, Tester, Designer, MeetingAttendee, DocumentationWriter
{
  code() {
    /* OK */
  }
  test() {
    /* OK */
  }
  design() {
    /* OK */
  }
  attendMeeting() {
    /* OK */
  }
  writeDocumentation() {
    /* OK */
  }
}
```

### Practical Approach

Don't over-segregate. Group methods that are **cohesive** — methods that are
always used together belong in the same interface.

```typescript
// Too granular — these always go together
interface Readable {
  read(): Buffer;
}
interface Seekable {
  seek(position: number): void;
}
interface Closeable {
  close(): void;
}

// Better — cohesive group
interface ReadableStream {
  read(): Buffer;
  seek(position: number): void;
  close(): void;
}

// Separate only what's genuinely optional
interface WritableStream {
  write(data: Buffer): void;
  flush(): void;
  close(): void;
}
```

### Detection

- Do implementors throw "not implemented" for some methods?
- Do implementors leave method bodies empty?
- Does a client use only a fraction of the interface's methods?

---

## D — Dependency Inversion Principle (DIP)

> "High-level modules should not depend on low-level modules. Both should depend
> on abstractions."

### Problem It Solves

Tight coupling to concrete implementations (specific database, email provider,
payment gateway). Hard to test, hard to swap.

### Before (Violates DIP)

```typescript
class OrderService {
  // Directly coupled to concrete implementations
  private db = new PostgresDatabase();
  private email = new SendGridClient();
  private logger = new WinstonLogger();

  async createOrder(data: OrderData) {
    this.logger.info("Creating order");
    const order = Order.create(data);
    await this.db.query("INSERT INTO orders ...", order);
    await this.email.send(data.customerEmail, "Order confirmed");
    return order;
  }
}

// Can't test without a real Postgres, SendGrid, and Winston
```

### After (DIP Applied)

```typescript
// Abstractions defined by the high-level module
interface OrderRepository {
  save(order: Order): Promise<void>;
}

interface EmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

interface Logger {
  info(message: string): void;
  error(message: string, error?: Error): void;
}

// High-level module depends on abstractions
class OrderService {
  constructor(
    private repo: OrderRepository,
    private email: EmailService,
    private logger: Logger,
  ) {}

  async createOrder(data: OrderData) {
    this.logger.info("Creating order");
    const order = Order.create(data);
    await this.repo.save(order);
    await this.email.send(data.customerEmail, "Order confirmed", order.summary());
    return order;
  }
}

// Low-level modules implement the abstractions
class PostgresOrderRepository implements OrderRepository {
  constructor(private db: Pool) {}

  async save(order: Order) {
    await this.db.query("INSERT INTO orders ...", order.toJSON());
  }
}

class SendGridEmailService implements EmailService {
  async send(to: string, subject: string, body: string) {
    // SendGrid-specific logic
  }
}

// Production wiring
const service = new OrderService(
  new PostgresOrderRepository(pool),
  new SendGridEmailService(),
  new ConsoleLogger(),
);

// Test wiring — easy to mock
const testService = new OrderService(
  new InMemoryOrderRepository(),
  new FakeEmailService(),
  new NoOpLogger(),
);
```

### The Dependency Rule

Source code dependencies should point **inward** — toward high-level business
logic, never toward infrastructure details.

```
Infrastructure → Application → Domain
    (outer)        (middle)     (inner)

Dependencies always flow: outer → inner
Never: inner → outer
```

### Detection

- Does business logic import database drivers, HTTP clients, or SDK modules?
- Does `new ConcreteClass()` appear inside business logic?
- Is it hard to write unit tests without real external services?

### Techniques

- **Constructor injection** — pass dependencies via constructor
- **Interface at boundary** — define interfaces in the domain layer, implement in infrastructure
- **Factory/DI container** — centralize wiring in composition root
