# API route modules

Route handlers must be declared **before** `export default router`.

Register static path segments (`/active`, `/summary`, `/top-earners`, `/search`) before parameterized routes (`/:id`, `/:address`) so Express does not treat literal segments as IDs.
