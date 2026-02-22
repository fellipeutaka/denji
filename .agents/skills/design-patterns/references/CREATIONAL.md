# Creational Patterns

Patterns that deal with object creation mechanisms, providing flexibility in
what gets created, how, and when.

---

## Factory Method

**Intent:** Define an interface for creating objects, but let subclasses decide
which class to instantiate.

**When to Use:**

- You don't know ahead of time what types of objects you need
- You want subclasses to specify the objects they create
- You need to decouple client code from concrete classes

```typescript
interface Notification {
  send(message: string): void;
}

class EmailNotification implements Notification {
  send(message: string) {
    console.log(`Email: ${message}`);
  }
}

class SMSNotification implements Notification {
  send(message: string) {
    console.log(`SMS: ${message}`);
  }
}

class PushNotification implements Notification {
  send(message: string) {
    console.log(`Push: ${message}`);
  }
}

abstract class NotificationService {
  // Factory method
  abstract createNotification(): Notification;

  notify(message: string) {
    const notification = this.createNotification();
    notification.send(message);
  }
}

class EmailService extends NotificationService {
  createNotification() {
    return new EmailNotification();
  }
}

class SMSService extends NotificationService {
  createNotification() {
    return new SMSNotification();
  }
}

// Usage
function getService(channel: "email" | "sms"): NotificationService {
  switch (channel) {
    case "email":
      return new EmailService();
    case "sms":
      return new SMSService();
  }
}

const service = getService("email");
service.notify("Your order has been shipped");
```

**Key Points:**

- The factory method returns an interface/abstract type, not a concrete class
- New product types can be added without modifying existing code (Open/Closed)
- Often combined with a simple registry or config for runtime selection

---

## Abstract Factory

**Intent:** Create families of related objects without specifying their concrete
classes.

**When to Use:**

- System must work with multiple families of related products
- You need to enforce that products from one family are used together
- You want to provide a library of products exposing only interfaces

```typescript
// Abstract products
interface Button {
  render(): string;
}

interface Input {
  render(): string;
}

interface Dialog {
  render(): string;
}

// Abstract factory
interface UIFactory {
  createButton(): Button;
  createInput(): Input;
  createDialog(): Dialog;
}

// Light theme family
class LightButton implements Button {
  render() {
    return '<button class="bg-white text-black">Click</button>';
  }
}

class LightInput implements Input {
  render() {
    return '<input class="border-gray-300 bg-white" />';
  }
}

class LightDialog implements Dialog {
  render() {
    return '<div class="bg-white shadow-lg">Dialog</div>';
  }
}

class LightUIFactory implements UIFactory {
  createButton() {
    return new LightButton();
  }
  createInput() {
    return new LightInput();
  }
  createDialog() {
    return new LightDialog();
  }
}

// Dark theme family
class DarkButton implements Button {
  render() {
    return '<button class="bg-gray-800 text-white">Click</button>';
  }
}

class DarkInput implements Input {
  render() {
    return '<input class="border-gray-600 bg-gray-800" />';
  }
}

class DarkDialog implements Dialog {
  render() {
    return '<div class="bg-gray-900 shadow-lg">Dialog</div>';
  }
}

class DarkUIFactory implements UIFactory {
  createButton() {
    return new DarkButton();
  }
  createInput() {
    return new DarkInput();
  }
  createDialog() {
    return new DarkDialog();
  }
}

// Usage — client code depends only on interfaces
function buildForm(factory: UIFactory) {
  const button = factory.createButton();
  const input = factory.createInput();
  return `${input.render()} ${button.render()}`;
}

const theme = "dark";
const factory = theme === "dark" ? new DarkUIFactory() : new LightUIFactory();
buildForm(factory);
```

**Key Points:**

- Guarantees product compatibility within a family
- Adding a new family is easy — just implement a new factory + products
- Adding a new product type requires changing the abstract factory interface

---

## Builder

**Intent:** Construct complex objects step-by-step, separating construction from
representation.

**When to Use:**

- Object has many optional parameters or configurations
- You want to avoid telescoping constructors
- Same construction process should create different representations
- Object must be immutable after construction

```typescript
interface QueryConfig {
  table: string;
  fields: string[];
  conditions: string[];
  orderBy?: string;
  limit?: number;
  offset?: number;
  joins: string[];
}

class QueryBuilder {
  private config: QueryConfig;

  constructor(table: string) {
    this.config = { table, fields: [], conditions: [], joins: [] };
  }

  select(...fields: string[]) {
    this.config.fields.push(...fields);
    return this;
  }

  where(condition: string) {
    this.config.conditions.push(condition);
    return this;
  }

  join(table: string, on: string) {
    this.config.joins.push(`JOIN ${table} ON ${on}`);
    return this;
  }

  orderBy(field: string) {
    this.config.orderBy = field;
    return this;
  }

  limit(n: number) {
    this.config.limit = n;
    return this;
  }

  offset(n: number) {
    this.config.offset = n;
    return this;
  }

  build(): string {
    const fields =
      this.config.fields.length > 0 ? this.config.fields.join(", ") : "*";
    let query = `SELECT ${fields} FROM ${this.config.table}`;

    if (this.config.joins.length > 0) {
      query += ` ${this.config.joins.join(" ")}`;
    }
    if (this.config.conditions.length > 0) {
      query += ` WHERE ${this.config.conditions.join(" AND ")}`;
    }
    if (this.config.orderBy) {
      query += ` ORDER BY ${this.config.orderBy}`;
    }
    if (this.config.limit !== undefined) {
      query += ` LIMIT ${this.config.limit}`;
    }
    if (this.config.offset !== undefined) {
      query += ` OFFSET ${this.config.offset}`;
    }
    return query;
  }
}

// Usage — fluent, readable construction
const query = new QueryBuilder("users")
  .select("id", "name", "email")
  .join("orders", "orders.user_id = users.id")
  .where("users.active = true")
  .where("orders.total > 100")
  .orderBy("users.name")
  .limit(10)
  .build();

// SELECT id, name, email FROM users JOIN orders ON orders.user_id = users.id
// WHERE users.active = true AND orders.total > 100 ORDER BY users.name LIMIT 10
```

**Key Points:**

- Fluent interface (method chaining) is the most common TS/JS builder style
- Each step returns `this` for chaining; `build()` finalizes
- Great for configuration objects, queries, HTTP requests, test fixtures

---

## Prototype

**Intent:** Create new objects by cloning an existing instance instead of
constructing from scratch.

**When to Use:**

- Object creation is expensive (DB lookups, complex computation)
- You need copies with slight variations
- You want to avoid subclass proliferation for object configurations

```typescript
interface Cloneable<T> {
  clone(): T;
}

interface DocumentConfig {
  title: string;
  font: string;
  fontSize: number;
  margins: { top: number; right: number; bottom: number; left: number };
  headers: boolean;
  footers: boolean;
}

class DocumentTemplate implements Cloneable<DocumentTemplate> {
  constructor(public config: DocumentConfig) {}

  clone(): DocumentTemplate {
    // Deep clone to avoid shared references
    return new DocumentTemplate(structuredClone(this.config));
  }

  withTitle(title: string): DocumentTemplate {
    const cloned = this.clone();
    cloned.config.title = title;
    return cloned;
  }

  withFont(font: string, size?: number): DocumentTemplate {
    const cloned = this.clone();
    cloned.config.font = font;
    if (size) cloned.config.fontSize = size;
    return cloned;
  }
}

// Pre-configured prototypes
const letterTemplate = new DocumentTemplate({
  title: "Untitled Letter",
  font: "Times New Roman",
  fontSize: 12,
  margins: { top: 72, right: 72, bottom: 72, left: 72 },
  headers: false,
  footers: true,
});

const reportTemplate = new DocumentTemplate({
  title: "Untitled Report",
  font: "Arial",
  fontSize: 11,
  margins: { top: 54, right: 54, bottom: 54, left: 54 },
  headers: true,
  footers: true,
});

// Usage — clone and customize
const myReport = reportTemplate.withTitle("Q4 Sales Report").withFont("Helvetica");
const myLetter = letterTemplate.withTitle("Cover Letter");
```

**Key Points:**

- Use `structuredClone()` (or deep-copy libs) to avoid shared mutable state
- Prototype registry: store named prototypes in a `Map` for easy lookup
- Combines well with Builder pattern for further customization after cloning

---

## Singleton

**Intent:** Ensure a class has exactly one instance and provide a global access
point to it.

**When to Use:**

- Shared resource like database connection pool, logger, or config
- Coordinating actions across the system (event bus, service registry)
- Controlling access to a resource with expensive initialization

```typescript
class Logger {
  private static instance: Logger;
  private logs: string[] = [];

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  log(level: "info" | "warn" | "error", message: string) {
    const entry = `[${new Date().toISOString()}] ${level.toUpperCase()}: ${message}`;
    this.logs.push(entry);
    console.log(entry);
  }

  getLogs(): readonly string[] {
    return this.logs;
  }
}

// Usage
const logger = Logger.getInstance();
logger.log("info", "Application started");
```

### Module-Level Singleton (Preferred in TypeScript)

In TypeScript/ES modules, the module itself acts as a singleton scope. This is
often simpler and more idiomatic than the class-based approach:

```typescript
// logger.ts — module-level singleton
const logs: string[] = [];

export function log(level: "info" | "warn" | "error", message: string) {
  const entry = `[${new Date().toISOString()}] ${level.toUpperCase()}: ${message}`;
  logs.push(entry);
  console.log(entry);
}

export function getLogs(): readonly string[] {
  return logs;
}

// consumer.ts
import { log } from "./logger";
log("info", "Application started");
```

**Key Points:**

- Prefer module-level singletons in TS — simpler, no class ceremony
- Class-based singletons are useful when you need lazy initialization or inheritance
- Singletons make testing harder — consider dependency injection instead
- Never use singletons as disguised global mutable state
