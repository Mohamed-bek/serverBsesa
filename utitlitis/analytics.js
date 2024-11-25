const generateMonthlyData = async (model, monthsBack = 6, cache = {}) => {
  const results = {
    months: [],
    counts: [],
  };

  // Check cache first to prevent redundant DB calls
  if (cache[monthsBack]) return cache[monthsBack];

  try {
    // Set the date for the start of the range
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (monthsBack - 1), 1); // Adjust to the start of the oldest month

    // Aggregation pipeline to calculate counts for each month
    const monthlyCounts = await model.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Populate results with each month's data
    const currentDate = new Date();
    for (let i = monthsBack - 1; i >= 0; i--) {
      const monthDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthYear = monthDate.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      const match = monthlyCounts.find(
        (data) =>
          data._id.year === monthDate.getFullYear() &&
          data._id.month === monthDate.getMonth() + 1
      );

      results.months.push(monthYear);
      results.counts.push(match ? match.count : 0);
    }

    // Cache the results
    cache[monthsBack] = results;
    return results;
  } catch (error) {
    console.error("Error generating monthly data:", error);
    throw new Error("Failed to generate monthly data.");
  }
};

export default generateMonthlyData;
