# UML diagrams vs this repository

Use this when drawing or grading **use case**, **class**, **communication**, and **sequence** diagrams so they match the running system.

## Actors and data model

- **Students and administrators** share one **`users`** table with a **`role`** column (`student` | `admin`), not two unrelated root classes. In UML, prefer **`User`** with **`role`**, or **`Student` / `Administrator` extends `User`**.
- Passwords are stored as **`password_hash`** (never plaintext). Diagrams should label **`passwordHash`**, not `password`.

## Course entity

- Courses expose **`code`**, **`title`**, **`description`**, **`credits`**, and **`capacity`** (see API/DB). If your class diagram used **`courseName`**, align it with **`title`** (and **`code`**) or label the diagram as conceptual.

## Enrollment and notifications

- **Approve enrollment** and **reject enrollment** both create an **in-app notification** for the student (see enrollment service). A «extend» **Notify Student** use case applies to **both** outcomes, not only approval.

## Real-time behavior

- Enrollment **status** is **persisted** and **updated on each API action**. The student UI **polls** the enrollments list on a fixed interval while the page is visible so status changes appear without a manual refresh. There is **no WebSocket/SSE** in this repo unless you add it.

## Authentication

- **Logout** clears the JWT on the client and **records the token id (`jti`) in `revoked_tokens`** until the token would have expired, so server-side invalidation matches the session lifetime.
