<div align="center">

# Campusly

### Peer-to-Peer Engineering Learning & Resource Sharing Platform

*Everything of campus, one community.*

A student-run web platform, like Reddit but focused on campus life, where juniors and seniors ask questions, find opportunities, exchange resources and learn from each other.

<br/>

![Domain](https://img.shields.io/badge/Domain-Sustainability-2ea44f?style=for-the-badge)
![SDG 4](https://img.shields.io/badge/SDG%204-Quality%20Education-c5192d?style=for-the-badge)
![SDG 12](https://img.shields.io/badge/SDG%2012-Responsible%20Consumption%20%26%20Production-bf8b2e?style=for-the-badge)

![React](https://img.shields.io/badge/React.js-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-0F172A?style=flat-square&logo=tailwindcss&logoColor=38BDF8)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=flat-square&logo=googlegemini&logoColor=white)

</div>

---

## Hackathon Submission

| | |
|---|---|
| **Event** | SYRUS 7.0 Hackathon, Vivekanand Education Society's Institute of Technology (Autonomous) |
| **Organised by** | CodeCell++, CMPN VESIT |
| **Domain** | Sustainability |
| **Problem Statement** | PS-4 |
| **PS Title** | CampusConnect: Peer-to-Peer Engineering Learning & Resource Sharing Platform |
| **Team** | ByteForce |
| **Built by** | Ayush Singh |

---

## Table of Contents

- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [Features](#features)
- [Platform Flow](#platform-flow)
- [Architecture](#architecture)
- [AI Layer: Powered by Gemini](#ai-layer-powered-by-gemini)
- [Showstopper: Snap a Photo, Listing Done](#showstopper-snap-a-photo-listing-done)
- [Tech Stack](#tech-stack)
- [Sustainability Impact](#sustainability-impact)

---

## The Problem

First-year engineering students often struggle when they join college. Navigating academics, exploring technical fields, and buying costly study materials feels overwhelming.

Meanwhile, seniors have useful tips and leftover resources like textbooks or calculators that sit unused or get lost in WhatsApp groups.

**What's missing** is a proper student-run platform where juniors can get guidance, ask questions without hesitation, and easily borrow, buy or exchange study materials.

| Pain point | What happens today |
|---|---|
| **No safe space to ask** | Juniors lack a student-run space to ask doubts and get guidance without hesitation. |
| **Fragmented knowledge** | Roadmaps, exam strategies and experiences stay scattered across WhatsApp groups. |
| **Idle resources** | Textbooks and calculators go unused with seniors while juniors buy costly new material. |

---

## Our Solution

**Campusly** is a simple web platform built just for engineering students. It brings juniors and seniors together so they can ask doubts, share experiences, find opportunities, discuss tech domains, and pass on study materials.

- Anyone can post with their name or stay **anonymous**, helping first-years open up easily.
- Seniors share **roadmaps, exam strategies, project stories and mentorship**.
- A central hub lists **hackathons and internships**.
- A **marketplace** lets students sell, lend or donate books, calculators and notes.
- Topic communities and resource exchange turn scattered knowledge into something **searchable and reusable**.
- **AI** powers better search, auto-moderation and short summaries of long threads.

Campusly supports **SDG 4 (Quality Education)** and **SDG 12 (Responsible Consumption and Production)**.

---

## Features

### Anonymous Q&A and Mentorship
Post questions anonymously or openly, get threaded senior advice, and upvote top answers on DSA, career paths and exams.
- Real user IDs are **masked at the auth layer**.
- As someone types, **MongoDB Atlas Vector Search** queries past discussions in real time using free Gemini embeddings to surface matching answers before they submit.

### Technical Communities
Dedicated hubs for **Web3, AI/ML, Cloud and DSA** to share roadmaps, project ideas and prep guides.
- A React feed loads community streams dynamically.
- For long, multi-comment discussion threads, a **1-click button** sends the conversation to **Gemini Flash** to output an actionable markdown checklist of key steps and shared links.

### Opportunity Hub
A curated board of hackathons, coding contests and internships with deadlines and application tips.
- When links are posted, a background check runs the text through **Gemini NLP** to scan for scam signals or dead links.
- If flagged, the document status silently updates in MongoDB to **hide it from the public feed until a senior approves it**.

### Academic Resource Exchange
Buy, sell, donate or borrow **calculators, textbooks, lab kits and notes** with condition filters.
- Students just upload a photo of the item to free cloud storage (like Supabase Storage).
- **Gemini Vision** reads the image to auto-detect the title, category and condition, populating a flexible MongoDB listing document with **zero manual typing**.

### Student Profiles and Engagement
Show study year, tech stack and karma scores, while bookmarking useful posts.
- Profiles, upvotes and saved post IDs live as fast document arrays in MongoDB, synced to the React frontend with **Supabase Auth** managing secure student logins.
- In the app, points are called **Brownies**: **+15** for publishing a discussion post, **+10** for upvotes received on posts, **+5** for helpful comments in threads, and **+5** for upvotes received on comments.
- A **Bitmoji avatar picker** offers 12 characters, or lets you customize a unique avatar, for your campus profile and comments.

### Moderation and Safety
Flag toxic content, scam listings and identity leaks, while keeping anonymous authors protected.
- Reports toggle a flag on the MongoDB document.
- If automated AI toxicity checks or user reports exceed a threshold, **Supabase Realtime / WebSockets** immediately strips the post from the UI and pushes an alert to the moderator view.

### AI-Assisted Features
Native semantic search, thread summaries and automated moderation baked into the app, powered by the free Google Gemini API (text, vision and embeddings) hooked into the backend APIs and MongoDB Atlas, running without extra infrastructure costs.

### Live Real-Time Chats
Learn from seniors through live real-time chats, alongside campus forums and resources. Sign in with your college email and password to access verified campus forums, resources and
