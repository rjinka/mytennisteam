import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <AppProvider>
            {children}
        </AppProvider>
    );
};

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
