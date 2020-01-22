#!/usr/bin/env python  
'''
Reference code for data loading. 
Author: Chongyang Bai
For more details, refer to the paper:
C.Bai, S. Kumar, J. Leskovec, M. Metzger, J.F. Nunamaker, V.S. Subrahmanian,
Predicting Visual Focus of Attention in Multi-person Discussion Videos,
International Joint Conference on Artificial Intelligence (IJCAI), 2019.
'''

import numpy as np
import pandas as pd

def loadGame(game, N):
	# N is the number of players in the game
	# load csv data
	# unweighted and weighted networks can be loaded exactly the same way
	# below shows the loader for weighted networks
	df_network = pd.read_csv(f'{src}/network{game}_weighted.csv', index_col = 0)

	# T is number of timestamps (10 frames)
	T = len(df_network)
	# load VFOA network to T x N x (N+1) array
	# vfoa[t, n, i] is the probability of player n+1 looking at object i at time t
	# i: 0 - laptop, 1 - player 1, 2 - player 2, ..., N - player N
	vfoa = np.reshape(df_network.values, (T,N,N+1))

	# print information
	print(f'network id:{game}\t length(x 1/3 second): {T}\t num of players: {N}')
	return vfoa

src = './network' # root dir of data
meta = pd.read_csv('network_list.csv')

for _, row in meta.iterrows():
	loadGame(row['NETWORK'], row['NUMBER_OF_PARTICIPANTS'])