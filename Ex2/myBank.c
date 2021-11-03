#include <stdio.h>
#include "myBank.h"
#define size 50
#define range 901
static int counts = 0;
float accounts[2][size];

int openAcc(float sum)
{
    int status;
    if (counts >= 50)
        return -1;

    else
    {
        int i;
        for (i=0; i<50; i++){
            if (accounts[0][i]!=1){
                accounts[1][counts] = sum;
                accounts[0][counts] = 1;
                counts++;
        status = 900 + counts;
        return status;
            }
        }
    }
    return -1;
}
//return how much money do we have in the account
float amount(int acc)
{
    int spot = acc - 901;
    if (accounts[0][spot] == 0)
        return -1;
    else
    {
        float sum = accounts[1][spot];
        return sum;
    }
}
//add to current amount of money iff the account is open
float deposit(int acc, float sum)
{
    if (sum>=0){
    int spot = range - acc;
    if (accounts[0][spot] == 0)
        return -1;
    else
    {
        int newSum = accounts[1][spot] + sum;
        accounts[1][spot] = newSum;
        return newSum;
    }
    }
    return -1;
}
//withdraw money iff there is enough money in it and if it is open
float withdrawl(int acc, float sum)
{
    int spot = range - acc;
    if (accounts[0][spot] == 0)
        return -1;
    else
    {
        int newSum = accounts[1][spot] - sum;

        if (newSum > accounts[1][spot])
            return -1;

        accounts[1][spot] = newSum;
        return newSum;
    }
}
//close account: change status to zero
void closeAcc(int acc)
{
    int spot = range - acc;
    if (accounts[0][spot]==0)
        printf("This account is already closed.\n");
    else{
    accounts[0][spot] = 0;
    accounts[1][spot] = 0;
    counts--;
    printf("Account was successfully closed!\n");
    }
}
//interest func will update every open acc
void interest(float rate)
{
    int i;
    rate = rate / 100;
    for (i = 0; i < 50; i++)
    {
        if (accounts[0][i] == 1)
        {
            float sum;
            sum = amount(i + range);
            float newSum;
            newSum = sum * (1 + rate);
            accounts[1][i] = newSum;
        }
    }
}
void printBalance()
{
    int i;
    int spot;
    for (i = 0; i < counts; i++)
    {
        if (accounts[0][i] == 1)
            spot = i + range;
        printf("Account num: %d, Balance: %.2f\n", spot, amount(spot));
    }
}
    void closeAll()
    {
        int i;
        for (i = 0; i < counts; i++)
        {
            if (accounts[0][i] == 1)
            {
                closeAcc(i + range);
            }
        }
    }
