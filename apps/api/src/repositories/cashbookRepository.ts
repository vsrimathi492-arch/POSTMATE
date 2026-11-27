import { localStore } from '../config/database';
import { ICashTransaction, IDailyCashBalance, TransactionType } from '@postmate/shared';
import { v4 as uuidv4 } from 'uuid';

export class CashbookRepository {
  static async getTransactions(officeId?: string, date?: string): Promise<ICashTransaction[]> {
    let list: ICashTransaction[] = localStore.getCollection('cashTransactions');
    if (officeId) {
      list = list.filter(t => t.officeId === officeId);
    }
    if (date) {
      list = list.filter(t => t.date.slice(0, 10) === date.slice(0, 10));
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async findTransactionById(id: string): Promise<ICashTransaction | null> {
    const list: ICashTransaction[] = localStore.getCollection('cashTransactions');
    return list.find(t => t.id === id) || null;
  }

  static async createTransaction(data: Partial<ICashTransaction>): Promise<ICashTransaction> {
    const list: ICashTransaction[] = localStore.getCollection('cashTransactions');
    const txNumber = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTx: ICashTransaction = {
      id: data.id || uuidv4(),
      transactionNumber: data.transactionNumber || txNumber,
      date: data.date || new Date().toISOString(),
      type: data.type || TransactionType.RECEIPT,
      category: data.category!,
      amount: Number(data.amount) || 0,
      description: data.description || '',
      relatedRecordId: data.relatedRecordId,
      relatedTrackingNumber: data.relatedTrackingNumber,
      enteredBy: data.enteredBy || 'SYSTEM',
      enteredByName: data.enteredByName || 'Postal Staff',
      isVerified: false,
      officeId: data.officeId || 'PO-600001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };

    list.unshift(newTx);
    localStore.setCollection('cashTransactions', list);

    // Auto-recalculate daily cash balance
    await this.recalculateDailyBalance(newTx.officeId, newTx.date.slice(0, 10));

    return newTx;
  }

  static async verifyTransaction(id: string, verifiedBy: string, verifiedByName: string): Promise<ICashTransaction | null> {
    const list: ICashTransaction[] = localStore.getCollection('cashTransactions');
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      isVerified: true,
      verifiedBy,
      verifiedByName,
      verifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    localStore.setCollection('cashTransactions', list);
    return list[idx];
  }

  static async getDailyBalance(officeId: string, date: string): Promise<IDailyCashBalance> {
    const balances: IDailyCashBalance[] = localStore.getCollection('dailyBalances');
    const day = date.slice(0, 10);
    let record = balances.find(b => b.officeId === officeId && b.date === day);

    if (!record) {
      // Find previous day's closing balance for opening balance
      const sortedPrev = balances
        .filter(b => b.officeId === officeId && b.date < day)
        .sort((a, b) => b.date.localeCompare(a.date));

      const openingBalance = sortedPrev.length > 0 ? sortedPrev[0].calculatedClosingBalance : 15000.00;

      record = {
        id: uuidv4(),
        date: day,
        officeId,
        openingBalance,
        totalReceipts: 0,
        totalPayments: 0,
        calculatedClosingBalance: openingBalance,
        reconciliationStatus: 'PENDING',
        isClosed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      balances.push(record);
      localStore.setCollection('dailyBalances', balances);
    }

    return record;
  }

  static async recalculateDailyBalance(officeId: string, date: string): Promise<IDailyCashBalance> {
    const balance = await this.getDailyBalance(officeId, date);
    const transactions = await this.getTransactions(officeId, date);

    const totalReceipts = transactions
      .filter(t => t.type === TransactionType.RECEIPT)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPayments = transactions
      .filter(t => t.type === TransactionType.PAYMENT)
      .reduce((sum, t) => sum + t.amount, 0);

    const calculatedClosingBalance = balance.openingBalance + totalReceipts - totalPayments;
    const discrepancyAmount = balance.verifiedPhysicalBalance !== undefined
      ? balance.verifiedPhysicalBalance - calculatedClosingBalance
      : undefined;

    const balances: IDailyCashBalance[] = localStore.getCollection('dailyBalances');
    const idx = balances.findIndex(b => b.id === balance.id);

    const updated: IDailyCashBalance = {
      ...balance,
      totalReceipts,
      totalPayments,
      calculatedClosingBalance,
      discrepancyAmount,
      updatedAt: new Date().toISOString()
    };

    if (idx !== -1) {
      balances[idx] = updated;
    } else {
      balances.push(updated);
    }
    localStore.setCollection('dailyBalances', balances);

    return updated;
  }

  static async reconcile(
    officeId: string,
    date: string,
    verifiedPhysicalBalance: number,
    reconciledBy: string,
    reconciledByName: string,
    notes?: string
  ): Promise<IDailyCashBalance> {
    const balance = await this.recalculateDailyBalance(officeId, date);
    const discrepancy = verifiedPhysicalBalance - balance.calculatedClosingBalance;

    const balances: IDailyCashBalance[] = localStore.getCollection('dailyBalances');
    const idx = balances.findIndex(b => b.id === balance.id);

    const updated: IDailyCashBalance = {
      ...balance,
      verifiedPhysicalBalance,
      discrepancyAmount: discrepancy,
      reconciliationStatus: discrepancy === 0 ? 'RECONCILED' : 'DISCREPANCY_NOTED',
      reconciledBy,
      reconciledByName,
      reconciledAt: new Date().toISOString(),
      reconciliationNotes: notes || (discrepancy === 0 ? 'Exact match with physical chest' : `Discrepancy of Rs. ${discrepancy} noted`),
      isClosed: true,
      updatedAt: new Date().toISOString()
    };

    if (idx !== -1) {
      balances[idx] = updated;
    } else {
      balances.push(updated);
    }
    localStore.setCollection('dailyBalances', balances);

    return updated;
  }
}
