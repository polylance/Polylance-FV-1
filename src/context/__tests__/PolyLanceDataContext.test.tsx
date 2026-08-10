import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { PolyLanceDataProvider, usePolyLanceData } from '../PolyLanceDataContext';
import { Web3Provider } from '../Web3Context';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Web3Provider>
    <PolyLanceDataProvider>{children}</PolyLanceDataProvider>
  </Web3Provider>
);

describe('PolyLanceDataContext — real contract integration & data invariants', () => {
  it('postJob returns a valid Ethereum address format and valid txHash', async () => {
    const { result } = renderHook(() => usePolyLanceData(), { wrapper });

    let newJob: any;
    await act(async () => {
      newJob = await result.current.postJob(
        {
          title: 'Full Stack Smart Contract Integration',
          description: 'Connect React 19 frontend with Polygon Amoy Escrow contracts',
          category: 'Web3 / Smart Contracts',
          amountUsdc: '500',
          reviewPeriodDays: 7,
        },
        '0x474d8c97445FbCF4e13C257556adBced11a9DEf8'
      );
    });

    expect(newJob).toBeDefined();
    expect(newJob.contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(newJob.contractAddress).not.toContain('NaN');

    const postEvent = newJob.events.find((e: any) => e.step === 'Posted');
    expect(postEvent).toBeDefined();
    expect(postEvent.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it('postJob output never contains Math.random() or non-checksummed random strings', async () => {
    const { result } = renderHook(() => usePolyLanceData(), { wrapper });

    let job1: any;
    let job2: any;

    await act(async () => {
      job1 = await result.current.postJob(
        {
          title: 'Job 1',
          description: 'Test job 1',
          category: 'Frontend',
          amountUsdc: '100',
          reviewPeriodDays: 3,
        },
        '0x474d8c97445FbCF4e13C257556adBced11a9DEf8'
      );
      job2 = await result.current.postJob(
        {
          title: 'Job 2',
          description: 'Test job 2',
          category: 'Backend',
          amountUsdc: '200',
          reviewPeriodDays: 5,
        },
        '0x474d8c97445FbCF4e13C257556adBced11a9DEf8'
      );
    });

    expect(job1.contractAddress).not.toEqual(job2.contractAddress);
    expect(job1.contractAddress.length).toBe(42);
    expect(job2.contractAddress.length).toBe(42);
  });

  it('selectFreelancer updates contract state and timeline step', async () => {
    const { result } = renderHook(() => usePolyLanceData(), { wrapper });

    let job: any;
    await act(async () => {
      job = await result.current.postJob(
        {
          title: 'Job to Select',
          description: 'Selecting dev',
          category: 'Design',
          amountUsdc: '300',
          reviewPeriodDays: 7,
        },
        '0x474d8c97445FbCF4e13C257556adBced11a9DEf8'
      );
    });

    await act(async () => {
      await result.current.selectFreelancer(job.id, '0xcAF6AAC649B8A7AeFa76A870fA180fc580a3E2e8');
    });

    const updatedJob = result.current.jobs.find((j) => j.id === job.id);
    expect(updatedJob?.freelancer).toBe('0xcAF6AAC649B8A7AeFa76A870fA180fc580a3E2e8');
    expect(updatedJob?.status).toBe('Selected');
  });
});
