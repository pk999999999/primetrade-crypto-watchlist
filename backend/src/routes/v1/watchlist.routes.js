import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import {
  getWatchlist,
  getWatchlistItem,
  createWatchlistItem,
  updateWatchlistItem,
  deleteWatchlistItem,
  getStats
} from '../../controllers/watchlist.controller.js';

const router = Router();

// All watchlist routes require authentication
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     WatchlistItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         user_id:
 *           type: integer
 *           example: 1
 *         symbol:
 *           type: string
 *           example: BTC
 *         name:
 *           type: string
 *           example: Bitcoin
 *         target_price:
 *           type: number
 *           example: 100000.00
 *         notes:
 *           type: string
 *           example: "Buy when it dips below target"
 *         alert_type:
 *           type: string
 *           enum: [above, below]
 *           example: above
 *         created_at:
 *           type: string
 *         updated_at:
 *           type: string
 */

/**
 * @swagger
 * /api/v1/watchlist:
 *   get:
 *     summary: Get watchlist items
 *     description: Users see their own items. Admins can see all items with ?viewAll=true
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: viewAll
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Admin only - view all users' items
 *     responses:
 *       200:
 *         description: List of watchlist items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WatchlistItem'
 *                 total:
 *                   type: integer
 */
router.get('/', getWatchlist);

/**
 * @swagger
 * /api/v1/watchlist/stats:
 *   get:
 *     summary: Get watchlist statistics
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Watchlist statistics
 */
router.get('/stats', getStats);

/**
 * @swagger
 * /api/v1/watchlist/{id}:
 *   get:
 *     summary: Get a single watchlist item
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Watchlist item ID
 *     responses:
 *       200:
 *         description: Watchlist item details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WatchlistItem'
 *       404:
 *         description: Item not found
 *       403:
 *         description: Not authorized to view this item
 */
router.get(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Item ID must be a positive integer.'),
    validate
  ],
  getWatchlistItem
);

/**
 * @swagger
 * /api/v1/watchlist:
 *   post:
 *     summary: Add a new item to watchlist
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symbol
 *               - name
 *             properties:
 *               symbol:
 *                 type: string
 *                 example: ETH
 *                 description: Crypto symbol (e.g., BTC, ETH, SOL)
 *               name:
 *                 type: string
 *                 example: Ethereum
 *               targetPrice:
 *                 type: number
 *                 example: 4500.00
 *               notes:
 *                 type: string
 *                 example: "Strong buy signal on weekly chart"
 *               alertType:
 *                 type: string
 *                 enum: [above, below]
 *                 example: above
 *     responses:
 *       201:
 *         description: Item added successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  [
    body('symbol')
      .trim()
      .notEmpty().withMessage('Symbol is required.')
      .isLength({ min: 1, max: 10 }).withMessage('Symbol must be between 1 and 10 characters.')
      .matches(/^[A-Za-z0-9]+$/).withMessage('Symbol must contain only letters and numbers.'),
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required.')
      .isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters.')
      .escape(),
    body('targetPrice')
      .optional({ nullable: true })
      .isFloat({ min: 0 }).withMessage('Target price must be a positive number.'),
    body('notes')
      .optional()
      .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters.')
      .trim(),
    body('alertType')
      .optional()
      .isIn(['above', 'below']).withMessage('Alert type must be either "above" or "below".'),
    validate
  ],
  createWatchlistItem
);

/**
 * @swagger
 * /api/v1/watchlist/{id}:
 *   put:
 *     summary: Update a watchlist item
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               symbol:
 *                 type: string
 *               name:
 *                 type: string
 *               targetPrice:
 *                 type: number
 *               notes:
 *                 type: string
 *               alertType:
 *                 type: string
 *                 enum: [above, below]
 *     responses:
 *       200:
 *         description: Item updated
 *       404:
 *         description: Item not found
 *       403:
 *         description: Not authorized
 */
router.put(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Item ID must be a positive integer.'),
    body('symbol')
      .optional()
      .trim()
      .isLength({ min: 1, max: 10 }).withMessage('Symbol must be between 1 and 10 characters.')
      .matches(/^[A-Za-z0-9]+$/).withMessage('Symbol must contain only letters and numbers.'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters.'),
    body('targetPrice')
      .optional({ nullable: true })
      .isFloat({ min: 0 }).withMessage('Target price must be a positive number.'),
    body('notes')
      .optional()
      .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters.'),
    body('alertType')
      .optional()
      .isIn(['above', 'below']).withMessage('Alert type must be either "above" or "below".'),
    validate
  ],
  updateWatchlistItem
);

/**
 * @swagger
 * /api/v1/watchlist/{id}:
 *   delete:
 *     summary: Remove an item from watchlist
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item deleted
 *       404:
 *         description: Item not found
 *       403:
 *         description: Not authorized
 */
router.delete(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Item ID must be a positive integer.'),
    validate
  ],
  deleteWatchlistItem
);

export default router;
