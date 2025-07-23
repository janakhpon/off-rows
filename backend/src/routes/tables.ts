import { Router } from "express";
import * as tablesController from "../controllers/tables";
import { tableZodSchema, tableRowZodSchema, tableViewZodSchema } from "../db/schema";
import { validate } from "../middleware/validate";

/**
 * @openapi
 * /api/tables:
 *   get:
 *     summary: List all tables
 *     tags: [Tables]
 *     responses:
 *       200:
 *         description: A list of tables
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TableInput'
 *   post:
 *     summary: Create a table
 *     tags: [Tables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TableInput'
 *     responses:
 *       201:
 *         description: The created table
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TableInput'
 *
 * /api/tables/{id}:
 *   get:
 *     summary: Get a table
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Table ID
 *     responses:
 *       200:
 *         description: A table
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TableInput'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Update a table
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Table ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TableInput'
 *     responses:
 *       200:
 *         description: The updated table
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TableInput'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Delete a table
 *     tags: [Tables]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Table ID
 *     responses:
 *       204:
 *         description: Table deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/tables/{tableId}/rows:
 *   get:
 *     summary: Get all rows for a table
 *     tags: [Rows]
 *     parameters:
 *       - in: path
 *         name: tableId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Table ID
 *     responses:
 *       200:
 *         description: A list of rows
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TableRowInput'
 *   post:
 *     summary: Create a row
 *     tags: [Rows]
 *     parameters:
 *       - in: path
 *         name: tableId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Table ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TableRowInput'
 *     responses:
 *       201:
 *         description: The created row
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TableRowInput'
 *
 * /api/tables/{tableId}/rows/bulk:
 *   post:
 *     summary: Bulk upsert rows for a table
 *     tags: [Rows]
 *     parameters:
 *       - in: path
 *         name: tableId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Table ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rows:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TableRowInput'
 *     responses:
 *       200:
 *         description: The upserted rows
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 upsertedRows:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TableRowInput'
 *
 * /api/tables/{tableId}/views:
 *   get:
 *     summary: Get all views for a table
 *     tags: [Views]
 *     parameters:
 *       - in: path
 *         name: tableId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Table ID
 *     responses:
 *       200:
 *         description: A list of views
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TableViewInput'
 *   post:
 *     summary: Create a view
 *     tags: [Views]
 *     parameters:
 *       - in: path
 *         name: tableId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Table ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TableViewInput'
 *     responses:
 *       201:
 *         description: The created view
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TableViewInput'
 *
 * /api/tables/rows/{id}:
 *   put:
 *     summary: Update a table row
 *     tags: [Rows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Row ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TableRowInput'
 *     responses:
 *       200:
 *         description: The updated row
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Delete a table row
 *     tags: [Rows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Row ID
 *     responses:
 *       204:
 *         description: Row deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/tables/views/{id}:
 *   put:
 *     summary: Update a table view
 *     tags: [Views]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: View ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TableViewInput'
 *     responses:
 *       200:
 *         description: The updated view
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Delete a table view
 *     tags: [Views]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: View ID
 *     responses:
 *       204:
 *         description: View deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/tables/sync:
 *   post:
 *     summary: Sync all data (tables, rows, views)
 *     tags: [Sync]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SyncRequest'
 *     responses:
 *       200:
 *         description: Sync results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 syncedTables:
 *                   type: integer
 *                 syncedRows:
 *                   type: integer
 *                 syncedViews:
 *                   type: integer
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 */
const router = Router();

// Table routes
router.get("/", tablesController.listTables);
router.get("/:id", tablesController.getTable);
router.post("/", validate(tableZodSchema), tablesController.createTable);
router.put("/:id", validate(tableZodSchema.partial()), tablesController.updateTable);
router.delete("/:id", tablesController.deleteTable);

// Table rows routes
router.get("/:tableId/rows", tablesController.getTableRows);
router.post("/:tableId/rows", validate(tableRowZodSchema), tablesController.createTableRow);
router.post("/:tableId/rows/bulk", tablesController.bulkUpsertRows);

// Table views routes
router.get("/:tableId/views", tablesController.getTableViews);
router.post("/:tableId/views", validate(tableViewZodSchema), tablesController.createTableView);

// Individual row and view routes
router.put("/rows/:id", validate(tableRowZodSchema.partial()), tablesController.updateTableRow);
router.delete("/rows/:id", tablesController.deleteTableRow);
router.put("/views/:id", validate(tableViewZodSchema.partial()), tablesController.updateTableView);
router.delete("/views/:id", tablesController.deleteTableView);

// Sync route
router.post("/sync", tablesController.syncAllData);

export default router; 