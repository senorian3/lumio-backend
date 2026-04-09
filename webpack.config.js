const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

// Получаем корневую директорию проекта
const rootDir = path.resolve(__dirname);

module.exports = (options) => {
  // Получаем базовую конфигурацию из NestJS
  const config = {
    ...options,
    resolve: {
      ...options.resolve,
      extensions: ['.ts', '.js', '.json'],
      plugins: [
        // Используем tsconfig-paths-webpack-plugin для разрешения путей из tsconfig.json
        new TsconfigPathsPlugin({
          configFile: path.join(rootDir, 'tsconfig.json'),
          extensions: ['.ts', '.js', '.json'],
        }),
      ],
      alias: {
        // Явно указываем алиасы для надежности
        '@libs': path.join(rootDir, 'libs'),
        '@lumio': path.join(rootDir, 'apps/lumio/src'),
        '@files': path.join(rootDir, 'apps/files/src'),
        '@payments': path.join(rootDir, 'apps/payments/src'),
        '@super-admin': path.join(rootDir, 'apps/super-admin/src'),
        '@generated': path.join(rootDir, 'generated'),
      },
    },
    module: {
      ...options.module,
      rules: options.module.rules.map((rule) => {
        if (rule.test.toString().includes('ts')) {
          return {
            ...rule,
            use: [
              {
                loader: 'ts-loader',
                options: {
                  configFile: path.join(rootDir, 'tsconfig.json'),
                  transpileOnly: true,
                  compilerOptions: {
                    declaration: false,
                  },
                },
              },
            ],
          };
        }
        return rule;
      }),
    },
  };

  return config;
};
