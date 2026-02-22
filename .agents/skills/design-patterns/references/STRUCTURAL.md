# Structural Patterns

Patterns that deal with object composition, assembling classes and objects into
larger structures while keeping them flexible and efficient.

---

## Adapter

**Intent:** Convert one interface into another that clients expect. Lets classes
work together that couldn't otherwise due to incompatible interfaces.

**When to Use:**

- Integrating third-party libraries with different interfaces
- Wrapping legacy code to match new interfaces
- Bridging between different data formats

```typescript
// Third-party analytics with its own interface
interface LegacyAnalytics {
  trackEvent(category: string, action: string, label: string): void;
  trackPageView(url: string, title: string): void;
}

class OldAnalyticsSDK implements LegacyAnalytics {
  trackEvent(category: string, action: string, label: string) {
    console.log(`Legacy: ${category}/${action}/${label}`);
  }
  trackPageView(url: string, title: string) {
    console.log(`Legacy pageview: ${url} - ${title}`);
  }
}

// Your app's expected interface
interface Analytics {
  track(event: string, properties?: Record<string, unknown>): void;
  page(name: string, properties?: Record<string, unknown>): void;
}

// Adapter bridges the gap
class AnalyticsAdapter implements Analytics {
  constructor(private legacy: LegacyAnalytics) {}

  track(event: string, properties?: Record<string, unknown>) {
    const category = (properties?.category as string) ?? "general";
    const label = (properties?.label as string) ?? "";
    this.legacy.trackEvent(category, event, label);
  }

  page(name: string, properties?: Record<string, unknown>) {
    const url = (properties?.url as string) ?? window.location.href;
    this.legacy.trackPageView(url, name);
  }
}

// Usage — client code uses your clean interface
const analytics: Analytics = new AnalyticsAdapter(new OldAnalyticsSDK());
analytics.track("button_click", { category: "ui", label: "signup" });
analytics.page("Home");
```

**Key Points:**

- Adapter wraps the adaptee, not modify it
- Useful for abstracting third-party SDKs behind your own interface
- Makes it easy to swap implementations later (e.g., change analytics provider)

---

## Bridge

**Intent:** Decouple an abstraction from its implementation so both can vary
independently.

**When to Use:**

- Multiple dimensions of variation (e.g., shape + renderer, message + channel)
- You want to avoid a combinatorial explosion of subclasses
- Abstraction and implementation should evolve independently

```typescript
// Implementation dimension: how messages are delivered
interface MessageSender {
  send(to: string, content: string): void;
}

class EmailSender implements MessageSender {
  send(to: string, content: string) {
    console.log(`Email to ${to}: ${content}`);
  }
}

class SlackSender implements MessageSender {
  send(to: string, content: string) {
    console.log(`Slack to ${to}: ${content}`);
  }
}

class SMSSender implements MessageSender {
  send(to: string, content: string) {
    console.log(`SMS to ${to}: ${content}`);
  }
}

// Abstraction dimension: what kind of notification
abstract class Notification {
  constructor(protected sender: MessageSender) {}
  abstract notify(to: string): void;
}

class AlertNotification extends Notification {
  constructor(
    sender: MessageSender,
    private severity: string,
    private message: string,
  ) {
    super(sender);
  }

  notify(to: string) {
    this.sender.send(to, `[ALERT-${this.severity}] ${this.message}`);
  }
}

class ReminderNotification extends Notification {
  constructor(
    sender: MessageSender,
    private task: string,
    private dueDate: string,
  ) {
    super(sender);
  }

  notify(to: string) {
    this.sender.send(to, `Reminder: "${this.task}" is due ${this.dueDate}`);
  }
}

// Usage — mix and match any notification type with any sender
const urgentAlert = new AlertNotification(new SlackSender(), "HIGH", "Server down");
urgentAlert.notify("#ops-channel");

const reminder = new ReminderNotification(new EmailSender(), "Code review", "tomorrow");
reminder.notify("dev@company.com");
```

**Key Points:**

- Without Bridge, you'd need `EmailAlert`, `SlackAlert`, `SMSAlert`, `EmailReminder`, etc.
- Bridge reduces N*M subclasses to N+M implementations
- Abstraction holds a reference to the implementation — that's the "bridge"

---

## Composite

**Intent:** Compose objects into tree structures and let clients treat individual
objects and compositions uniformly.

**When to Use:**

- Representing hierarchies (file systems, UI trees, org charts)
- Clients should treat leaf and composite nodes the same way
- Recursive structures where operations apply at any level

```typescript
interface FileSystemNode {
  getName(): string;
  getSize(): number;
  print(indent?: string): void;
}

class File implements FileSystemNode {
  constructor(
    private name: string,
    private size: number,
  ) {}

  getName() {
    return this.name;
  }

  getSize() {
    return this.size;
  }

  print(indent = "") {
    console.log(`${indent}${this.name} (${this.size} bytes)`);
  }
}

class Directory implements FileSystemNode {
  private children: FileSystemNode[] = [];

  constructor(private name: string) {}

  add(node: FileSystemNode) {
    this.children.push(node);
    return this;
  }

  remove(node: FileSystemNode) {
    this.children = this.children.filter((c) => c !== node);
  }

  getName() {
    return this.name;
  }

  getSize(): number {
    return this.children.reduce((sum, child) => sum + child.getSize(), 0);
  }

  print(indent = "") {
    console.log(`${indent}${this.name}/`);
    this.children.forEach((child) => child.print(indent + "  "));
  }
}

// Usage
const src = new Directory("src")
  .add(new File("index.ts", 1200))
  .add(
    new Directory("components")
      .add(new File("Button.tsx", 800))
      .add(new File("Input.tsx", 600)),
  )
  .add(new Directory("utils").add(new File("helpers.ts", 400)));

src.print();
// src/
//   index.ts (1200 bytes)
//   components/
//     Button.tsx (800 bytes)
//     Input.tsx (600 bytes)
//   utils/
//     helpers.ts (400 bytes)

console.log(src.getSize()); // 3000
```

**Key Points:**

- Both `File` and `Directory` implement the same interface
- Composite (Directory) delegates to children, enabling recursion
- Operations like `getSize()` propagate naturally through the tree

---

## Decorator

**Intent:** Attach additional responsibilities to objects dynamically, providing
a flexible alternative to subclassing.

**When to Use:**

- Adding features to objects without modifying their class
- Combining behaviors in various ways at runtime
- When subclassing would lead to an explosion of classes

```typescript
interface HttpClient {
  request(url: string, options?: RequestInit): Promise<Response>;
}

class FetchClient implements HttpClient {
  async request(url: string, options?: RequestInit) {
    return fetch(url, options);
  }
}

// Decorator: add authentication headers
class AuthDecorator implements HttpClient {
  constructor(
    private client: HttpClient,
    private getToken: () => string,
  ) {}

  async request(url: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${this.getToken()}`);
    return this.client.request(url, { ...options, headers });
  }
}

// Decorator: add retry logic
class RetryDecorator implements HttpClient {
  constructor(
    private client: HttpClient,
    private maxRetries = 3,
  ) {}

  async request(url: string, options?: RequestInit) {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.client.request(url, options);
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.maxRetries) {
          await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
        }
      }
    }
    throw lastError;
  }
}

// Decorator: add logging
class LoggingDecorator implements HttpClient {
  constructor(private client: HttpClient) {}

  async request(url: string, options?: RequestInit) {
    console.log(`-> ${options?.method ?? "GET"} ${url}`);
    const start = performance.now();
    const response = await this.client.request(url, options);
    console.log(`<- ${response.status} (${(performance.now() - start).toFixed(0)}ms)`);
    return response;
  }
}

// Usage — stack decorators in any combination
let client: HttpClient = new FetchClient();
client = new AuthDecorator(client, () => "my-token");
client = new RetryDecorator(client, 3);
client = new LoggingDecorator(client);

client.request("https://api.example.com/users");
```

**Key Points:**

- Each decorator wraps and delegates to the inner client
- Stack order matters: logging wraps retry wraps auth wraps fetch
- Decorators are composable — add/remove without changing other decorators
- In TS, this is the same idea behind middleware stacks

---

## Facade

**Intent:** Provide a simplified interface to a complex subsystem.

**When to Use:**

- Complex subsystem with many interdependent classes
- You need a simple entry point for common use cases
- Decoupling client code from subsystem internals

```typescript
// Complex subsystem classes
class VideoDecoder {
  decode(file: string) {
    return `decoded:${file}`;
  }
}

class AudioExtractor {
  extract(decoded: string) {
    return `audio:${decoded}`;
  }
}

class SubtitleParser {
  parse(file: string) {
    return `subs:${file}`;
  }
}

class VideoRenderer {
  render(video: string, audio: string, subs?: string) {
    return `rendering [${video}] [${audio}]${subs ? ` [${subs}]` : ""}`;
  }
}

// Facade — simple interface hiding subsystem complexity
class VideoPlayer {
  private decoder = new VideoDecoder();
  private audioExtractor = new AudioExtractor();
  private subtitleParser = new SubtitleParser();
  private renderer = new VideoRenderer();

  play(file: string, subtitleFile?: string) {
    const decoded = this.decoder.decode(file);
    const audio = this.audioExtractor.extract(decoded);
    const subs = subtitleFile
      ? this.subtitleParser.parse(subtitleFile)
      : undefined;

    return this.renderer.render(decoded, audio, subs);
  }
}

// Usage — client only interacts with the facade
const player = new VideoPlayer();
player.play("movie.mp4", "movie.srt");
```

**Key Points:**

- Facade doesn't prevent direct subsystem access when needed
- Keeps the subsystem flexible while offering convenience
- Common in libraries providing both high-level and low-level APIs

---

## Flyweight

**Intent:** Share common state across many objects to minimize memory usage.

**When to Use:**

- Application creates a huge number of similar objects
- Objects contain significant shared (intrinsic) state
- Shared state can be extracted and reused

```typescript
// Intrinsic state — shared across instances
interface ParticleType {
  sprite: string;
  color: string;
  maxSpeed: number;
}

// Flyweight factory — caches and reuses shared state
class ParticleTypeFactory {
  private types = new Map<string, ParticleType>();

  getType(sprite: string, color: string, maxSpeed: number): ParticleType {
    const key = `${sprite}:${color}:${maxSpeed}`;
    if (!this.types.has(key)) {
      this.types.set(key, { sprite, color, maxSpeed });
    }
    return this.types.get(key)!;
  }

  get count() {
    return this.types.size;
  }
}

// Extrinsic state — unique per instance (coordinates, velocity)
class Particle {
  constructor(
    private x: number,
    private y: number,
    private velocityX: number,
    private velocityY: number,
    private type: ParticleType, // shared reference
  ) {}

  move(dt: number) {
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
  }

  draw(canvas: CanvasRenderingContext2D) {
    // Uses shared sprite/color from type, unique position from instance
    console.log(
      `Draw ${this.type.sprite} at (${this.x}, ${this.y}) color=${this.type.color}`,
    );
  }
}

// Usage — 10,000 particles but only a few shared types
const factory = new ParticleTypeFactory();
const particles: Particle[] = [];

for (let i = 0; i < 5000; i++) {
  const type = factory.getType("spark.png", "orange", 200);
  particles.push(
    new Particle(Math.random() * 800, Math.random() * 600, Math.random() * 10, Math.random() * 10, type),
  );
}

for (let i = 0; i < 5000; i++) {
  const type = factory.getType("smoke.png", "gray", 50);
  particles.push(
    new Particle(Math.random() * 800, Math.random() * 600, Math.random() * 2, Math.random() * 2, type),
  );
}

console.log(`10,000 particles, only ${factory.count} shared types`); // 2
```

**Key Points:**

- Split state into intrinsic (shared) and extrinsic (unique per instance)
- Flyweight factory ensures shared objects are reused, not duplicated
- Trade-off: slightly more complex code for significantly less memory

---

## Proxy

**Intent:** Provide a substitute or placeholder for another object to control
access to it.

**When to Use:**

- Lazy initialization of expensive objects (virtual proxy)
- Access control / authorization (protection proxy)
- Caching results (caching proxy)
- Logging or monitoring access (logging proxy)

```typescript
interface ImageService {
  getImage(id: string): Promise<Buffer>;
  getMetadata(id: string): Promise<{ width: number; height: number }>;
}

class RemoteImageService implements ImageService {
  async getImage(id: string) {
    console.log(`Fetching image ${id} from remote server...`);
    // Simulate expensive network call
    return Buffer.from(`image-data-${id}`);
  }

  async getMetadata(id: string) {
    console.log(`Fetching metadata for ${id}...`);
    return { width: 1920, height: 1080 };
  }
}

// Caching proxy
class CachedImageProxy implements ImageService {
  private imageCache = new Map<string, Buffer>();
  private metaCache = new Map<string, { width: number; height: number }>();

  constructor(private service: ImageService) {}

  async getImage(id: string) {
    if (!this.imageCache.has(id)) {
      this.imageCache.set(id, await this.service.getImage(id));
    }
    return this.imageCache.get(id)!;
  }

  async getMetadata(id: string) {
    if (!this.metaCache.has(id)) {
      this.metaCache.set(id, await this.service.getMetadata(id));
    }
    return this.metaCache.get(id)!;
  }
}

// Access control proxy
class AuthImageProxy implements ImageService {
  constructor(
    private service: ImageService,
    private isAuthorized: () => boolean,
  ) {}

  async getImage(id: string) {
    if (!this.isAuthorized()) {
      throw new Error("Unauthorized access");
    }
    return this.service.getImage(id);
  }

  async getMetadata(id: string) {
    // Metadata is public
    return this.service.getMetadata(id);
  }
}

// Usage — stack proxies
let imageService: ImageService = new RemoteImageService();
imageService = new CachedImageProxy(imageService);
imageService = new AuthImageProxy(imageService, () => true);

await imageService.getImage("photo-1"); // fetches from remote
await imageService.getImage("photo-1"); // served from cache
```

**Key Points:**

- Proxy has the same interface as the real service — transparent to clients
- Can be stacked like decorators, but intent differs: proxy controls access, decorator adds behavior
- `Proxy` class in JS/TS (ES6) is a language-level proxy for metaprogramming — different concept but related idea
