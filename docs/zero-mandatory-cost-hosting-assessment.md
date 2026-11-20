# Hosting feasibility and publication decision — November 20, 2026

**Decision state: NO PUBLIC DEPLOYMENT AUTHORIZED.** AMI-108 is a private five-chapter local game with Next.js 16 Web, NestJS API, FastAPI authorization/validation, PostgreSQL 17 and Ollama Qwen2.5:1.5b. The owner requires **R$ 0 mandatory service cost**. A current free-tier webpage alone is not proof this entire persistent, private, real-inference stack can run for free or securely.

## What was already decided — do not confuse development with hosting

**Previously approved and actually used:** **Google Cloud Shell (GCP)** for private development, integration, Docker Compose debugging and Web Preview; **GitHub Actions** for CI, tests and builds; GitHub private repository for issues, PRs and source history. **AWS CloudShell** was discussed only for possible **AWS CLI / infrastructure-as-code work** if justified, **not** for continuously hosting the game. Codespaces was an untested alternative; an automated Vercel deployment suggestion was **not** owner authorization. **No AWS, GCP, OCI, Vercel or Cloudflare public production hosting provider was selected or deployed.**

**Professional development context:** Prior job/application research included **junior React, frontend, full-stack and web developer** opportunities, where React, TypeScript, JavaScript and Node.js were relevant. The owner's separate learning plan also prioritized **AWS, Linux, Docker, GitHub Actions/CI/CD, Terraform/OpenTofu and cloud fundamentals**. These are relevant portfolio skills, **not a claim that every reviewed vacancy required AWS, Kubernetes or IaC**. AMI-108 already demonstrates React/Next.js, NestJS/Node, TypeScript, Python/FastAPI, PostgreSQL, Docker Compose and real CI; deployment should extend that evidence *without* pretending that a proposed cloud design was actually implemented.

**Career-aligned next technical exercise:** document a reproducible private deployment architecture with **Linux, Docker Compose, health/readiness, least-privilege secrets and GitHub Actions checks**, then add **reviewable OpenTofu/Terraform-style IaC** for the *eventually approved provider* and record `fmt`/`validate` results. An IaC plan without executed infrastructure must be labeled **simulated/proposed**, not production deployment. AWS-specific networking/IAM/EC2/RDS/CloudWatch can be demonstrated later through narrowly scoped, owner-authorized labs with verified remaining free entitlements; don't move the live game/saves there automatically. **Kubernetes/EKS is not justified for a small CPU-bound five-service game on a zero-cost budget**, so do not add it merely for résumé keywords.

## Candidate comparison from official provider documentation

| Option | Verified product facts | Constraint for this exact game | Gate |
| --- | --- | --- | --- |
| Google Cloud Shell | Google provides approximately 5 GB persistent `$HOME` on a temporary VM. Official quota and lifetime limits apply. | Dev/preview only; Docker volumes/VM can disappear. The user already experienced a recycled VM and needed a verified 7-session backup. **Not stable public hosting.** | Keep private for development and owner QA; no production claim |
| Cloudflare Pages (Free) | Official [Pages limits](https://developers.cloudflare.com/pages/platform/limits/) list 500 builds/month for Free. [Next.js Pages guidance](https://developers.cloudflare.com/pages/framework-guides/nextjs/) directs full-stack Next.js to Workers/vinext; Pages is suitable for static export. | Not a drop-in hosting solution for current NestJS, private FastAPI, PostgreSQL and persistent Ollama. A static-only site cannot preserve the existing game's behavior without a redesign. | REJECT AS STANDALONE FULL-STACK OPTION |
| Cloudflare Workers | The official [Next.js guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) describes full-stack support. | Requires separate treatment/migration of Node API, database and inference; operational/free-tier CPU and persistence must be validated. Not automatically compatible with current Docker Compose. | RESEARCH ONLY; no deployment |
| OCI Ampere A1 Always Free | Oracle documents up to **2 OCPUs / 12 GB RAM equivalent**, aggregate 1,500 OCPU-hours and 9,000 GB-hours/month and **200 GB** Always Free combined block volume in tenancy home region. [Official limits](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm). | Potential small-stack research candidate only: ARM64 container and Ollama compatibility, 2-OCPU inference latency, signup/region availability and actual quotas untested. Oracle warns of host-capacity shortages and idle VM reclamation. Account verification may require a card. | NEEDS OWNER ACCOUNT/TERMS APPROVAL, PRIVATE LAB TEST AND COST BOUNDARIES; NO ASSUMED ELIGIBILITY |
| AWS Free Plan (new accounts where eligible) | The [official AWS Free Tier](https://aws.amazon.com/free/) describes up to **US$200 credits over up to six months** on the newer Free Plan, with expiration at six months or credit exhaustion; legacy accounts have different rules. | Valuable for **hands-on EC2, IAM, networking, RDS, CLI/IaC and CI/CD**, but credits are **temporary** and do not prove perpetual R$0 for a resident Ollama/PostgreSQL stack. Account plan, regions and usage are unknown. | CAREER LAB CANDIDATE ONLY; no AWS deployment or cost commitment |
| Vercel Hobby / free frontend | [Official Hobby plan](https://vercel.com/docs/plans/hobby) is for **personal, noncommercial use** with limits; it can showcase a Next.js frontend. | Not a managed PostgreSQL + NestJS + FastAPI + always-resident Ollama solution; separate providers increase CORS/ingress/storage and privacy review. A deploy suggestion or old Vercel notification is **not** a running AMI-108 deployment. | PREVIEW POSSIBILITY ONLY; verify terms and full-stack compatibility |
| Google Cloud Run/free usage | [Free program](https://docs.cloud.google.com/free/docs/free-cloud-features) provides monthly usage allowances; usage above them and some network/storage is billable. | Does not prove 24/7 resident Ollama, durable PostgreSQL, private ingress and public traffic will stay at R$0. | NOT PROVEN ZERO-COST FULL STACK |

Google Cloud Shell: [official operation](https://docs.cloud.google.com/shell/docs/how-cloud-shell-works) and [quota limits](https://docs.cloud.google.com/shell/docs/quotas-limits). Oracle terms: [Free Tier overview](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm). Confirm official terms again immediately before any account or provisioning decision.

## Technical shortlist for the full, unchanged game

**Keep the existing accepted Docker application intact.** The strongest single-VM research candidate for sustained no-mandatory-cost hosting is **OCI Ampere A1 Always Free**, *only if* the owner has eligible account capacity, ARM64-compatible images and a measured Qwen response under the permitted CPU/RAM limits; instance reclamation and signup limits are important operational risks. If it fails any of those checks, **do not claim a free full-stack deployment**. The lowest-risk and most career-relevant immediately demonstrable path remains **Cloud Shell private game + GitHub Actions + Docker/CI evidence**, optionally adding *non-provisioning* AWS/OpenTofu design and tests. AWS Free Plan is a time-limited **learning lab**, not the default permanent R$0 host.

The portfolio should accurately distinguish **implemented**, **tested in GitHub Actions**, **simulated as IaC**, and **actually hosted**. Security and rights/classification gates apply equally to any provider.

## Recommended honest completion choices

**A. Private/local release candidate (available today without a new provider).** Freeze the accepted code and original art, pass remaining manual QA, reconcile private canonical documents, record an internal release decision and preserve seven original saves. The game remains runnable privately on Cloud Shell under the safe-resume protocol. This can be labeled **private development complete**, **not public v1.0.0 release**. It still requires the owner's explicit acceptance of the remaining private QA scope.

**B. Public release later (not safe to assume today).** First choose a hosting provider/plan with verifiable R$0 mandatory cost for *all* services or obtain explicit consent to a different cost model; then implement a separate secure deployment architecture, capacity limits, TLS/proxy policy, origin enforcement, storage retention and backups, privacy and content classification. Test against a disposable DB, never the seven owner sessions. Obtain explicit owner approval to create any account, change repository visibility or publicly expose endpoints.

## Open public-deployment gates

- Trusted HTTPS canonical origin and secure cookies; reject Host/X-Forwarded-Host spoofing; production opt-in must fail closed. Current `AMI_DEV_PREVIEW=1` is not a production authorization.
- Public ingress only for Web. NestJS API, FastAPI, Ollama and PostgreSQL must remain private; model requests authenticated, bounded and redacted.
- Cross-session inference/user-session creation quotas, concurrent model capacity, retry/429 and retention policy; no rate-limit bypass for anonymous creation.
- Reproducible architecture for a continuously available data store, persistent volumes, migrations, encrypted/off-instance backup and restore drill.
- OS/container/JS/Python/license audit, manual assistive-tech and performance evidence, legal asset distribution and classification checks.
- Costs and account rules verified before provisioning; no trial credits mistaken for always-free service, no paid resources authorized.

## Brazilian age classification and distribution

The current in-game **16+ content advisory is editorial, not an official rating**. The Brazilian Ministry of Justice [Jogos e Apps](https://www.gov.br/mj/pt-br/assuntos/seus-direitos/classificacao-1/paginas-classificacao-indicativa/jogos-e-apps) states that exclusively digital games/apps can be self-classified under Brazilian criteria if proper symbols/descriptors are displayed; IARC is a possible system for eligible digital-store distribution. Applicability to the actual chosen browser distribution, required processes/symbols and youth-protection obligations must be reviewed before launch. Do not represent the existing 16+ label as official or replace it without owner/legal review.

## Decision to obtain from owner

Choose **A: finish as a private, locally playable project without public release**, or **B: pursue public hosting and authorize a specific provider with explicit free-tier/cost rules**. Neither choice modifies the accepted story. All account registration, resource provisioning, public repository visibility, license changes and `v1.0.0` tagging remain blocked until an explicit owner decision and verified release gates.

This is a feasibility assessment based on official provider docs checked on November 20, 2026, **not** a current account entitlement/eligibility check, actual deployment, hiring-market frequency study or cost guarantee.
