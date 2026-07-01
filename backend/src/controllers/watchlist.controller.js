import WatchlistModel from '../models/watchlist.model.js';

/**
 * GET /api/v1/watchlist
 * Get watchlist items - users see their own, admins can see all
 */
export async function getWatchlist(req, res, next) {
  try {
    const { viewAll } = req.query;
    let items;

    // Admins can view all items with ?viewAll=true
    if (req.user.role === 'admin' && viewAll === 'true') {
      items = WatchlistModel.findAll();
    } else {
      items = WatchlistModel.findByUserId(req.user.id);
    }

    res.status(200).json({
      success: true,
      data: items,
      total: items.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/watchlist/:id
 * Get a single watchlist item by ID
 */
export async function getWatchlistItem(req, res, next) {
  try {
    const { id } = req.params;
    const item = WatchlistModel.findById(parseInt(id));

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Watchlist item with ID ${id} not found.`
      });
    }

    // Users can only see their own items
    if (req.user.role !== 'admin' && item.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this item.'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/watchlist
 * Add a new item to watchlist
 */
export async function createWatchlistItem(req, res, next) {
  try {
    const { symbol, name, targetPrice, notes, alertType } = req.body;

    const item = WatchlistModel.create({
      userId: req.user.id,
      symbol,
      name,
      targetPrice: targetPrice || null,
      notes: notes || '',
      alertType: alertType || 'above'
    });

    res.status(201).json({
      success: true,
      message: `${symbol.toUpperCase()} added to your watchlist!`,
      data: item
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/watchlist/:id
 * Update a watchlist item
 */
export async function updateWatchlistItem(req, res, next) {
  try {
    const { id } = req.params;
    const existing = WatchlistModel.findById(parseInt(id));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Watchlist item with ID ${id} not found.`
      });
    }

    // Users can only update their own items
    if (req.user.role !== 'admin' && existing.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this item.'
      });
    }

    const { symbol, name, targetPrice, notes, alertType } = req.body;
    const updated = WatchlistModel.update(parseInt(id), {
      symbol,
      name,
      targetPrice,
      notes,
      alertType
    });

    res.status(200).json({
      success: true,
      message: 'Watchlist item updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/watchlist/:id
 * Remove an item from watchlist
 */
export async function deleteWatchlistItem(req, res, next) {
  try {
    const { id } = req.params;
    const existing = WatchlistModel.findById(parseInt(id));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Watchlist item with ID ${id} not found.`
      });
    }

    // Users can only delete their own items
    if (req.user.role !== 'admin' && existing.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this item.'
      });
    }

    WatchlistModel.delete(parseInt(id));

    res.status(200).json({
      success: true,
      message: `${existing.symbol} removed from watchlist.`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/watchlist/stats
 * Get watchlist statistics
 */
export async function getStats(req, res, next) {
  try {
    let stats;

    if (req.user.role === 'admin') {
      const totalItems = WatchlistModel.countAll();
      const allItems = WatchlistModel.findAll();
      const uniqueSymbols = [...new Set(allItems.map(i => i.symbol))];

      stats = {
        totalItems,
        uniqueSymbols: uniqueSymbols.length,
        topSymbols: uniqueSymbols.slice(0, 5)
      };
    } else {
      const userItems = WatchlistModel.findByUserId(req.user.id);
      const uniqueSymbols = [...new Set(userItems.map(i => i.symbol))];

      stats = {
        totalItems: userItems.length,
        uniqueSymbols: uniqueSymbols.length,
        symbols: uniqueSymbols
      };
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
}
