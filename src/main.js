/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет прибыли от операции
   const { discount, sale_price, quantity } = purchase;
   const multiply = 1 - (purchase.discount / 100);
   // Возвращаем выручку с учётом скидки
   return sale_price * quantity * multiply;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    // index - позиция продавца в рейтинге
    // total - общее количество продавцов
    // seller - карточка продавца с полями profit, revenue и т.д.
    const { profit } = seller;
    // Логика расчета бонуса: чем выше позиция, тем больше бонус
    // 15% — для продавца, который принёс наибольшую прибыль.
    // 10% — для продавцов, которые оказались на втором и третьем месте по прибыли.
    // 5% — для всех остальных продавцов, кроме последнего.
    // 0% — для продавца, который оказался на последнем месте.

    if (index === 0) {
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        return profit * 0.10;
    } else if (index === total - 1) {
        return profit * 0;
    } else {
        return profit * 0.05;
    }
    
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    const { calculateRevenue, calculateBonus } = options;

    if (!data || !Array.isArray(data.sellers) || data.sellers.length === 0) {
        throw new Error('Invalid data format or empty sellers array');
    }

    // @TODO: Проверка наличия опций
    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Options must contain valid functions for calculateRevenue and calculateBonus');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));


    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = sellerStats.reduce((acc, seller) => ({
        ...acc,
        [seller.id]: seller
    }), {});

    const productIndex = data.products.reduce((acc, product) => ({
        ...acc,
        [product.sku]: product
    }), {});

    // @TODO: Расчёт выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id]; // Продавец
        seller.sales_count += 1; // Увеличиваем счетчик продаж
        seller.revenue += record.total_amount; // Добавляем выручку от продажи

        // Расчет прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const cost = product.purchase_price * item.quantity;
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            const revenue = calculateRevenue(item, product);
            // Посчитать прибыль: выручка минус себестоимость
            const profit = revenue - cost;
            // Увеличить общую накопленную прибыль (profit) у продавца  
            seller.profit += profit;

            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            // По артикулу товара увеличить его проданное количество у продавца
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // Сортируем продавцов по прибыли по уменьшению
    sellerStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначить премии на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10); // Сохраняем только ТОП-10 продуктов

    });
    
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: seller.bonus.toFixed(2)
    }));

    

    // @TODO: Подготовка итоговой коллекции с нужными полями
}