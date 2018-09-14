module.exports = {

  apps : [
    {
      name        : 'account',
      script      : './account_server/app.js',
      args        : '../config/config.my',
      interpreter : 'node',
    },
    {
      name        : 'hall',
      script      : './hall_server/app.js',
      args        : '../config/config.my',
      interpreter : 'node',
    },
    {
      name        : 'running',
      script      : './poker_running_server/app.js',
      args        : '../config/config.my',
      interpreter : 'node',
    },
    {
      name        : 'landlord',
      script      : './poker_landlord_server/app.js',
      args        : '../config/config.my',
      interpreter : 'node',
    },
    {
      name        : 'ox',
      script      : './poker_ox_server/app.js',
      args        : '../config/config.my',
      interpreter : 'node',
    },
    {
      name        : 'goldflower',
      script      : './poker_goldflower_server/app.js',
      args        : '../config/config.my',
      interpreter : 'node',
    },
    {
      name        : 'taxas',
      script      : './poker_TaxasHoldem_server/app.js',
      args        : '../config/config.my',
      interpreter : 'node',
    },
    {
      name        : 'sangong',
      script      : './poker_sangong_server/app.js',
      args        : '../config/config.my',
      interpreter : 'node',
    },
    {
      name        : 'shisanshui',
      script      : './poker_shisanshui_server/app.js',
      args        : '../config/config.my',
      interpreter : 'node',
    },
    {
      name        : 'points21',
      script      : './poker_21_server/app.js',
      args        : '../config/config.my',
      interpreter : 'node',
    },
    {
      name        : 'points105',
      script      : './poker_10point_server/app.js',
      args        : '../config/config.my',
      interpreter : 'node',
    },
    {
      name        : 'sandaha',
      script      : './poker_sandaha_server/app.js',
      args        : '../config/config.my',
      interpreter : 'node',
    }
  ],
};
