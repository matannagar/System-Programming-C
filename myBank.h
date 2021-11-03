#ifndef MYBANK_H_INCLUDED
#define MYBANK_H_INCLUDED

extern float account[2][50];

int openAcc(float);
int accCount();
float amount(int);
int accStatus(int);
//add to current amount of money iff the account is open
float deposit(int,float);
//withdraw money iff there is enough money in it and if it is open
float withdrawl(int,float);
//close account: change status to zero
void closeAcc(int);
//interest func will update every open acc
void interest(float);
void printBalance();
void closeAll();

#endif // MYBANK_H_INCLUDED
